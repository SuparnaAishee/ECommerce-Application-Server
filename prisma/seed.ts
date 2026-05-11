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
  "Sports & Outdoor": "WildPeak",
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
  "Sports & Outdoor": ["sports-accessories"],
};

// When DummyJSON doesn't have enough products in a slug, append these curated
// entries so each category lands ≥ 20 products. Images come from loremflickr
// with tags that reliably hit on-target Flickr photography.
type Backfill = { name: string; tag: string; brand: string; price: number };

// Backfill is intentionally empty for Mobile / Electronics / Computers & Laptops.
// Earlier we used loremflickr tags to pad these but Flickr kept returning unrelated
// photos (e.g. a generic camera for "Mini Drone with HD Camera"). Better to ship
// fewer products with real DummyJSON imagery than 20+ with off-target stock photos.
const BACKFILL: Record<string, Backfill[]> = {};

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
    blurb:
      "Sports and outdoor gear for weekend adventurers — bags, bottles, gloves, helmets and the kit that travels with you.",
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
    const extraFollowers = randInt(120, 2400);
    const shopRow = await prisma.shop.upsert({
      where: { userId: vendor.id },
      update: { shopDetails: shop.blurb, extraFollowers },
      create: {
        userId: vendor.id,
        shopName: shop.name,
        shopDetails: shop.blurb,
        shopLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(shop.name)}&backgroundColor=fff7ed,ffedd5,fed7aa&fontFamily=Helvetica`,
        extraFollowers,
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
