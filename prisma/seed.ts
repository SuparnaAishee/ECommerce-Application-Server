import { PrismaClient, Prisma, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ----- deterministic helpers --------------------------------------------------

const SEED = 1759;
let rngState = SEED;
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) % 0x100000000;
  return rngState / 0x100000000;
};
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const weightedRating = () => {
  const r = rand();
  if (r < 0.55) return 5;
  if (r < 0.85) return 4;
  return 3;
};

const stableLock = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h % 100000;
};

// ----- catalogue model -------------------------------------------------------

type CatalogueProduct = {
  name: string;
  description: string;
  price: number;
  inventory: number;
  images: string[];
  brand?: string;
};

type CatalogueCategory = {
  name: string;
  bannerImage: string | null;
  shop: string;
  products: CatalogueProduct[];
};

const CATEGORY_TO_SHOP: Record<string, string> = {
  Mobile: "TechHub Bangladesh",
  Electronics: "TechHub Bangladesh",
  "Computers & Laptops": "TechHub Bangladesh",
  "Home & Kitchen": "Casa Mia",
  Grocery: "Casa Mia",
  "Skin Care": "EverGlow",
  Makeup: "EverGlow",
  "Fashion - Men": "UrbanThread",
  "Fashion - Women": "UrbanThread",
  Books: "Casa Mia",
  Toys: "WildPeak",
};

const DUMMYJSON_CATEGORY_MAP: Record<string, string[]> = {
  Mobile: ["smartphones"],
  Electronics: ["mobile-accessories"],
  "Computers & Laptops": ["laptops", "tablets"],
  "Home & Kitchen": ["furniture", "home-decoration", "kitchen-accessories"],
  Grocery: ["groceries"],
  "Skin Care": ["skin-care"],
  Makeup: ["beauty"],
  "Fashion - Men": ["mens-shirts", "mens-shoes", "mens-watches", "sunglasses"],
  "Fashion - Women": [
    "womens-bags",
    "womens-dresses",
    "womens-jewellery",
    "womens-shoes",
    "womens-watches",
    "tops",
  ],
};

// When DummyJSON doesn't have enough products in a slug, append these curated
// entries so each category lands ≥ 20 products. Images come from loremflickr
// with tags that reliably hit on-target Flickr photography.
type Backfill = { name: string; tag: string; brand: string; price: number };

const BACKFILL: Record<string, Backfill[]> = {
  Electronics: [
    { name: "Wireless Bluetooth Earbuds Pro", tag: "earbuds,bluetooth", brand: "Anker", price: 79 },
    { name: "Over-ear Noise-Cancelling Headphones", tag: "headphones,audio", brand: "Sony", price: 249 },
    { name: "Smartwatch Fitness Tracker", tag: "smartwatch,fitness", brand: "Garmin", price: 199 },
    { name: "Portable Bluetooth Speaker IPX7", tag: "speaker,bluetooth", brand: "JBL", price: 79 },
    { name: "Power Bank 20000mAh USB-C", tag: "powerbank,charger", brand: "Anker", price: 49 },
    { name: "Action Camera 4K Waterproof", tag: "action,camera", brand: "GoPro", price: 349 },
    { name: "Mini Drone with HD Camera", tag: "drone,camera", brand: "DJI", price: 299 },
    { name: "Streaming Stick 4K HDR", tag: "streaming,tv", brand: "Roku", price: 49 },
  ],
  Mobile: [
    { name: "Galaxy Mid-Range Phone 128GB", tag: "smartphone,phone", brand: "Samsung", price: 349 },
    { name: "Compact Flagship Phone 256GB", tag: "smartphone,iphone", brand: "Apple", price: 999 },
    { name: "Budget Android Phone 64GB", tag: "android,phone", brand: "Xiaomi", price: 179 },
    { name: "Foldable Smartphone 512GB", tag: "foldable,phone", brand: "Samsung", price: 1299 },
    { name: "Gaming Phone 12GB RAM", tag: "gaming,phone", brand: "ASUS ROG", price: 749 },
    { name: "Rugged Outdoor Phone IP68", tag: "rugged,phone", brand: "AGM", price: 299 },
  ],
  "Computers & Laptops": [
    { name: "Ultra-thin 14\" i7 Laptop 16GB", tag: "laptop,computer", brand: "Dell", price: 1199 },
    { name: "Gaming Laptop RTX 4060", tag: "gaming,laptop", brand: "ASUS", price: 1499 },
    { name: "Convertible 2-in-1 Laptop 13\"", tag: "convertible,laptop", brand: "Lenovo", price: 899 },
    { name: "Mechanical Keyboard RGB", tag: "mechanical,keyboard", brand: "Razer", price: 119 },
    { name: "Wireless Mouse Ergonomic", tag: "mouse,wireless", brand: "Logitech", price: 49 },
    { name: "27\" 4K Monitor IPS", tag: "monitor,4k,desk", brand: "LG", price: 379 },
    { name: "USB-C Hub 8-in-1", tag: "usb,hub,cables", brand: "Anker", price: 39 },
    { name: "External SSD 1TB Portable", tag: "ssd,external,drive", brand: "Samsung", price: 119 },
    { name: "Webcam 1080p Streaming", tag: "webcam,camera", brand: "Logitech", price: 79 },
    { name: "Laptop Stand Aluminum Adjustable", tag: "laptop,stand,desk", brand: "Rain Design", price: 59 },
    { name: "Noise-Cancelling USB Microphone", tag: "microphone,desk", brand: "Blue Yeti", price: 129 },
    { name: "Mesh Office Chair Ergonomic", tag: "office,chair,desk", brand: "Herman Miller", price: 599 },
    { name: "Laptop Cooling Pad RGB", tag: "laptop,cooling", brand: "TopMate", price: 35 },
    { name: "Drawing Tablet Pen Display", tag: "drawing,tablet,wacom", brand: "Wacom", price: 219 },
  ],
};

// ----- DummyJSON ingestion ---------------------------------------------------

type DummyProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  thumbnail?: string;
  category: string;
  brand?: string;
  stock: number;
};

const fetchDummy = async (): Promise<DummyProduct[]> => {
  const url =
    "https://dummyjson.com/products?limit=200&select=id,title,description,price,images,thumbnail,category,brand,stock";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DummyJSON ${res.status}`);
  const json = (await res.json()) as { products: DummyProduct[] };
  return json.products ?? [];
};

const backfillToProducts = (entries: Backfill[]): CatalogueProduct[] =>
  entries.map((e) => {
    const lock = stableLock(e.name);
    return {
      name: e.name,
      description: `${e.name} by ${e.brand}. Tested, picked, and shelf-ready.`,
      price: e.price,
      inventory: 25 + (lock % 175),
      images: [
        `https://loremflickr.com/600/600/${encodeURIComponent(e.tag)}?lock=${lock}`,
        `https://loremflickr.com/600/600/${encodeURIComponent(e.tag)}?lock=${lock + 1}`,
      ],
      brand: e.brand,
    };
  });

const buildDummyCategories = (
  products: DummyProduct[],
): CatalogueCategory[] => {
  const out: CatalogueCategory[] = [];
  for (const [ourName, sourceSlugs] of Object.entries(
    DUMMYJSON_CATEGORY_MAP,
  )) {
    const matching = products.filter((p) => sourceSlugs.includes(p.category));
    if (matching.length === 0 && !BACKFILL[ourName]) continue;

    const fromUpstream: CatalogueProduct[] = matching.map((p) => ({
      name: p.title,
      description: p.description,
      price: p.price,
      inventory: p.stock,
      images: (p.images ?? []).slice(0, 3),
      brand: p.brand,
    }));

    const backfill = BACKFILL[ourName]
      ? backfillToProducts(BACKFILL[ourName])
      : [];
    const combined = [...fromUpstream, ...backfill];

    const banner =
      matching.find((p) => p.images?.length)?.images?.[0] ??
      matching[0]?.thumbnail ??
      combined[0]?.images[0] ??
      null;

    out.push({
      name: ourName,
      bannerImage: banner,
      shop: CATEGORY_TO_SHOP[ourName],
      products: combined,
    });
  }
  return out;
};

// ----- Google Books ingestion ------------------------------------------------

type GoogleBook = {
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    pageCount?: number;
    publisher?: string;
  };
  saleInfo?: { listPrice?: { amount?: number } };
};

const BOOK_SUBJECTS = [
  "fiction",
  "biography",
  "self-help",
  "business",
  "science",
  "history",
];

const fetchBooks = async (): Promise<CatalogueProduct[]> => {
  const all: CatalogueProduct[] = [];
  for (const subject of BOOK_SUBJECTS) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${subject}&maxResults=8&printType=books&orderBy=relevance`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { items?: GoogleBook[] };
      for (const item of json.items ?? []) {
        const v = item.volumeInfo;
        const img =
          v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
        if (!v.title || !img) continue;
        const httpsImg = img.replace(/^http:/, "https:");
        const author = v.authors?.[0] ?? v.publisher ?? "an established author";
        const desc =
          v.description ?? `${v.title} — a ${subject} book by ${author}.`;
        const price =
          item.saleInfo?.listPrice?.amount ??
          Number((randInt(8, 35) + Math.random()).toFixed(2));
        all.push({
          name: v.title,
          description: desc.slice(0, 600),
          price,
          inventory: randInt(20, 240),
          images: [httpsImg],
          brand: author,
        });
      }
    } catch {
      // skip subject on failure, keep going
    }
  }
  // De-duplicate by title
  const seen = new Set<string>();
  return all.filter((b) => {
    const k = b.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ----- Makeup API ingestion --------------------------------------------------

type MakeupApiProduct = {
  brand?: string;
  name?: string;
  price?: string;
  image_link?: string;
  description?: string;
  product_type?: string;
};

const MAKEUP_TYPES = [
  "lipstick",
  "foundation",
  "eyeshadow",
  "mascara",
  "eyeliner",
  "blush",
  "bronzer",
  "lip_liner",
  "eyebrow",
];

const fetchMakeup = async (): Promise<CatalogueProduct[]> => {
  const all: CatalogueProduct[] = [];
  for (const type of MAKEUP_TYPES) {
    try {
      const url = `https://makeup-api.herokuapp.com/api/v1/products.json?product_type=${type}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const items = (await res.json()) as MakeupApiProduct[];
      for (const item of items.slice(0, 4)) {
        if (!item.name || !item.image_link) continue;
        if (!/^https?:\/\//.test(item.image_link)) continue;
        const httpsImg = item.image_link.replace(/^http:/, "https:");
        const price =
          parseFloat(item.price ?? "") ||
          Number((randInt(8, 60) + Math.random()).toFixed(2));
        const brand = item.brand
          ? item.brand.charAt(0).toUpperCase() + item.brand.slice(1)
          : "Makeup Co.";
        const cleanName = item.name.replace(/\s+/g, " ").trim();
        all.push({
          name: cleanName,
          description: (
            item.description ?? `${cleanName} by ${brand}.`
          ).slice(0, 600),
          price,
          inventory: randInt(20, 200),
          images: [httpsImg],
          brand,
        });
      }
    } catch {
      // skip failing type
    }
  }
  // Dedup by name
  const seen = new Set<string>();
  return all.filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ----- Open Beauty Facts (skin care) ---------------------------------------

type BeautyFactsProduct = {
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  ingredients_text?: string;
};

const fetchSkinCare = async (): Promise<CatalogueProduct[]> => {
  const out: CatalogueProduct[] = [];
  const subCategories = [
    "skin-care",
    "moisturizers",
    "facial-care",
    "serums",
    "creams",
  ];
  for (const cat of subCategories) {
    try {
      const url = `https://world.openbeautyfacts.org/api/v2/search?categories_tags=${cat}&fields=product_name,brands,image_url,image_front_url,ingredients_text&page_size=10`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DokanXpress/1.0 (seed)" },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { products?: BeautyFactsProduct[] };
      for (const item of json.products ?? []) {
        const name = (item.product_name ?? "").trim();
        const img = item.image_url || item.image_front_url;
        if (!name || !img) continue;
        if (!/^https?:\/\//.test(img)) continue;
        const brand = (item.brands ?? "").split(",")[0]?.trim() || "Skincare Lab";
        out.push({
          name,
          description: (
            item.ingredients_text
              ? `${name}. Key ingredients: ${item.ingredients_text}`
              : `${name} by ${brand}. Curated skincare for your routine.`
          ).slice(0, 600),
          price: Number((randInt(8, 75) + Math.random()).toFixed(2)),
          inventory: randInt(20, 220),
          images: [img.replace(/^http:/, "https:")],
          brand,
        });
      }
    } catch {
      // skip
    }
  }
  // Dedup by name
  const seen = new Set<string>();
  return out.filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ----- Toys curated catalogue -----------------------------------------------

const TOY_SEEDS: { name: string; tag: string; brand: string; price: number }[] =
  [
    { name: "Classic LEGO Creator 3-in-1 Set", tag: "lego,toy", brand: "LEGO", price: 39.99 },
    { name: "Wooden Building Blocks 100-piece", tag: "wooden,blocks,toy", brand: "Melissa & Doug", price: 24.5 },
    { name: "Rubik's Cube 3×3 Speed Edition", tag: "rubiks,cube", brand: "Rubik's", price: 12.99 },
    { name: "Plush Teddy Bear 30cm", tag: "teddy,bear,plush", brand: "Build-A-Bear", price: 18 },
    { name: "Remote Control Off-road Truck", tag: "rc,car,toy", brand: "Traxxas", price: 79 },
    { name: "Magnetic Tiles 64-piece Starter Set", tag: "magnetic,tiles,toy", brand: "Magna-Tiles", price: 49.5 },
    { name: "Wooden Train Set with Tracks", tag: "train,wooden,toy", brand: "BRIO", price: 34 },
    { name: "Educational Robot Kit for Kids", tag: "robot,kit,kids", brand: "LittleBits", price: 89 },
    { name: "Soft Foam Building Blocks XL", tag: "foam,blocks,toy", brand: "Melissa & Doug", price: 29 },
    { name: "Family Board Game · Strategy", tag: "boardgame,strategy", brand: "Hasbro", price: 32 },
    { name: "Slime Science Lab Kit", tag: "slime,kit", brand: "National Geographic", price: 22.5 },
    { name: "Plush Unicorn Stuffed Animal", tag: "unicorn,plush", brand: "Aurora", price: 19.99 },
    { name: "Wooden Doll House 3-storey", tag: "dollhouse,wooden", brand: "KidKraft", price: 119 },
    { name: "Toy Kitchen Cooking Playset", tag: "play,kitchen,toy", brand: "Step2", price: 64.99 },
    { name: "Action Figure 12-inch Hero", tag: "action,figure,toy", brand: "Hasbro", price: 25 },
    { name: "Mini RC Drone for Beginners", tag: "drone,toy", brand: "Holy Stone", price: 49 },
    { name: "Jigsaw Puzzle 1000-piece Landscape", tag: "jigsaw,puzzle", brand: "Ravensburger", price: 16.5 },
    { name: "Toddler Push & Ride Car", tag: "ride,car,toddler", brand: "Little Tikes", price: 54 },
    { name: "Marble Run Tower Set", tag: "marble,run,toy", brand: "Quadrilla", price: 79 },
    { name: "Soft Cloth Baby Activity Cube", tag: "baby,cube,activity", brand: "Manhattan Toy", price: 27 },
    { name: "Stunt Scooter for Kids", tag: "scooter,kids", brand: "Razor", price: 89 },
    { name: "Glow-in-the-dark Star Stickers", tag: "stars,glow,kids", brand: "Great Explorations", price: 9.99 },
    { name: "Race Track 36-piece Loop Set", tag: "race,track,toy", brand: "Hot Wheels", price: 28 },
    { name: "Plastic Tea Party Playset", tag: "tea,party,toy", brand: "Melissa & Doug", price: 22 },
    { name: "Construction Crane Truck Toy", tag: "crane,truck,toy", brand: "Bruder", price: 65 },
  ];

const buildToys = (): CatalogueCategory => {
  const products: CatalogueProduct[] = TOY_SEEDS.map((t) => {
    const lock = stableLock(t.name);
    return {
      name: t.name,
      description: `${t.name} by ${t.brand}. Tested for safety, designed to spark imagination.`,
      price: t.price,
      inventory: randInt(20, 200),
      images: [
        `https://loremflickr.com/600/600/${encodeURIComponent(t.tag)}?lock=${lock}`,
        `https://loremflickr.com/600/600/${encodeURIComponent(t.tag)}?lock=${lock + 1}`,
      ],
      brand: t.brand,
    };
  });
  return {
    name: "Toys",
    bannerImage: products[0].images[0],
    shop: CATEGORY_TO_SHOP.Toys,
    products,
  };
};

// ----- Static seed data ------------------------------------------------------

const SHOPS = [
  {
    name: "TechHub Bangladesh",
    email: "vendor1@dokanxpress.dev",
    blurb:
      "Phones, laptops, and the gadgets that go with them — sourced from the best Asian electronics distributors.",
  },
  {
    name: "UrbanThread",
    email: "vendor2@dokanxpress.dev",
    blurb:
      "A modern wardrobe in one place. Smart shirts, denim, sneakers, watches and the accessories to finish the fit.",
  },
  {
    name: "Casa Mia",
    email: "vendor3@dokanxpress.dev",
    blurb:
      "Furniture, kitchen-tested essentials, and well-bound books — pick a corner of your home and we'll have it covered.",
  },
  {
    name: "WildPeak",
    email: "vendor4@dokanxpress.dev",
    blurb: "Outdoor gear and family toys for weekend adventurers.",
  },
  {
    name: "EverGlow",
    email: "vendor5@dokanxpress.dev",
    blurb: "Skin, makeup, and clean beauty drops curated by the team.",
  },
] as const;

const CUSTOMERS = [
  { email: "alice@dokanxpress.dev", name: "Alice Rahman" },
  { email: "bob@dokanxpress.dev", name: "Bob Chen" },
  { email: "carol@dokanxpress.dev", name: "Carol Hossain" },
] as const;

const REVIEW_SNIPPETS = [
  "Quality is excellent for the price.",
  "Arrived faster than expected, packaging was solid.",
  "Exactly as described — happy customer.",
  "Used it for two weeks now, no complaints.",
  "Would buy again. Recommended.",
  "Better than the brand-name version I had before.",
  "Good build quality, gift-worthy.",
  "Solid value, exceeded my expectations.",
  "Works as intended, simple to use.",
  "Met all my expectations. Five stars.",
];

// ----- main seeding ----------------------------------------------------------

async function main() {
  console.log("fetching catalogues…");
  const [dummy, books, makeup, skinCare] = await Promise.all([
    fetchDummy(),
    fetchBooks(),
    fetchMakeup(),
    fetchSkinCare(),
  ]);
  console.log(
    `  → DummyJSON ${dummy.length} | Books ${books.length} | Makeup ${makeup.length} | Skin Care ${skinCare.length}`,
  );

  const catalogue: CatalogueCategory[] = [];
  // DummyJSON-driven categories (skip Makeup / Skin Care — they get real
  // product data from Makeup API / Open Beauty Facts below)
  catalogue.push(
    ...buildDummyCategories(dummy).filter(
      (c) => c.name !== "Makeup" && c.name !== "Skin Care",
    ),
  );

  if (makeup.length > 0) {
    catalogue.push({
      name: "Makeup",
      bannerImage: makeup[0]?.images[0] ?? null,
      shop: CATEGORY_TO_SHOP.Makeup,
      products: makeup,
    });
  }
  if (skinCare.length > 0) {
    catalogue.push({
      name: "Skin Care",
      bannerImage: skinCare[0]?.images[0] ?? null,
      shop: CATEGORY_TO_SHOP["Skin Care"],
      products: skinCare,
    });
  }

  if (books.length > 0) {
    catalogue.push({
      name: "Books",
      bannerImage: books[0]?.images[0] ?? null,
      shop: CATEGORY_TO_SHOP.Books,
      products: books,
    });
  }
  catalogue.push(buildToys());

  console.log("clearing previous catalogue…");
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.comparison.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("seeding vendors and shops…");
  const passwordHash = await bcrypt.hash("password123", 12);
  const shopsByName = new Map<string, { id: string; name: string }>();
  for (const shop of SHOPS) {
    const vendor = await prisma.user.upsert({
      where: { email: shop.email },
      update: {},
      create: {
        email: shop.email,
        name: shop.name + " Owner",
        password: passwordHash,
        role: Role.VENDOR,
      },
    });
    const shopRow = await prisma.shop.upsert({
      where: { userId: vendor.id },
      update: { shopDetails: shop.blurb },
      create: {
        userId: vendor.id,
        shopName: shop.name,
        shopDetails: shop.blurb,
        shopLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(shop.name)}&backgroundColor=fff7ed,ffedd5,fed7aa&fontFamily=Helvetica`,
      },
    });
    shopsByName.set(shop.name, { id: shopRow.id, name: shop.name });
  }

  console.log("seeding customers…");
  const customerRows: { id: string; email: string }[] = [];
  for (const c of CUSTOMERS) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        password: passwordHash,
        role: Role.USER,
      },
    });
    customerRows.push({ id: u.id, email: u.email });
  }

  console.log("seeding categories + products…");
  let productCount = 0;
  let flashSaleCount = 0;
  const productIds: string[] = [];

  for (const cat of catalogue) {
    const shop = shopsByName.get(cat.shop);
    if (!shop) {
      console.warn(`  · skipping ${cat.name}: no shop ${cat.shop}`);
      continue;
    }

    const created = await prisma.category.create({
      data: {
        name: cat.name,
        image:
          cat.bannerImage ??
          `https://placehold.co/800x500/fed7aa/9a3412?text=${encodeURIComponent(cat.name)}`,
      },
    });

    for (const product of cat.products) {
      const isFlashSale = rand() < 0.18;
      if (isFlashSale) flashSaleCount++;
      const discountPct = isFlashSale ? randInt(10, 40) : null;
      const saleEnd = isFlashSale
        ? new Date(Date.now() + randInt(2, 14) * 24 * 60 * 60 * 1000)
        : null;
      const saleStart = isFlashSale ? new Date() : null;

      const images =
        product.images.length > 0
          ? product.images
          : [
              `https://placehold.co/600x600/fed7aa/9a3412?text=${encodeURIComponent(product.name)}`,
            ];

      const data: Prisma.ProductCreateInput = {
        name: product.name,
        description: product.description,
        price: product.price,
        inventory: product.inventory,
        isFlashSale,
        discount_percentage: discountPct,
        sale_start_time: saleStart,
        sale_end_time: saleEnd,
        images,
        category: { connect: { id: created.id } },
        shop: { connect: { id: shop.id } },
      };
      const row = await prisma.product.create({ data });
      productIds.push(row.id);
      productCount++;
    }
  }

  console.log(`  → ${productCount} products (${flashSaleCount} flash sale)`);

  console.log("seeding reviews…");
  let reviewCount = 0;
  for (const productId of productIds) {
    const reviewers = randInt(1, customerRows.length);
    const eligible = [...customerRows]
      .sort(() => rand() - 0.5)
      .slice(0, Math.min(reviewers, customerRows.length));
    for (const customer of eligible) {
      try {
        await prisma.review.create({
          data: {
            userId: customer.id,
            productId,
            rating: weightedRating(),
            comment:
              REVIEW_SNIPPETS[
                Math.floor(rand() * REVIEW_SNIPPETS.length)
              ],
          },
        });
        reviewCount++;
      } catch {
        // skip on duplicate
      }
    }
  }

  console.log("seeding demo coupon…");
  await prisma.coupon.upsert({
    where: { code: "WELCOME15" },
    update: {},
    create: {
      code: "WELCOME15",
      discount: 15,
      discountType: "PERCENTAGE",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minimumOrderValue: 50,
      usageLimit: 1000,
    },
  });

  console.log(
    `\nseed complete:\n  ${catalogue.length} categories\n  ${shopsByName.size} shops/vendors\n  ${customerRows.length} customers\n  ${productCount} products (${flashSaleCount} on flash sale)\n  ${reviewCount} reviews\n  1 coupon (WELCOME15)`,
  );
}

main()
  .catch((e) => {
    console.error("seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
