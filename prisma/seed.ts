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
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const weightedRating = () => {
  const r = rand();
  if (r < 0.55) return 5;
  if (r < 0.85) return 4;
  return 3;
};

const productImage = (id: string) =>
  `https://picsum.photos/seed/dx-${id}/600/600`;

// ----- catalog templates ------------------------------------------------------

const CATEGORIES = [
  "Electronics",
  "Computers & Laptops",
  "Smartphones",
  "Audio & Headphones",
  "Home & Kitchen",
  "Fashion - Men",
  "Fashion - Women",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Health & Wellness",
] as const;

type CategoryName = (typeof CATEGORIES)[number];

const CATEGORY_PRODUCTS: Record<
  CategoryName,
  { names: string[]; priceMin: number; priceMax: number }
> = {
  Electronics: {
    names: [
      "4K Smart TV 55\"",
      "Robot Vacuum Cleaner",
      "Wireless Charging Pad",
      "Smart Plug 2-Pack",
      "Mirrorless Camera Kit",
      "Drone with 4K Camera",
      "Action Camera Pro",
      "Bluetooth Speaker Cube",
    ],
    priceMin: 25,
    priceMax: 1200,
  },
  "Computers & Laptops": {
    names: [
      "Ultrabook 14\" i7",
      "Gaming Laptop 16GB RAM",
      "Mechanical Keyboard RGB",
      "Wireless Mouse Ergonomic",
      "27\" 4K Monitor",
      "USB-C Hub 8-in-1",
      "External SSD 1TB",
      "Webcam 1080p",
    ],
    priceMin: 18,
    priceMax: 1900,
  },
  Smartphones: {
    names: [
      "Flagship Phone 256GB",
      "Mid-range Phone 128GB",
      "Phone Case Clear",
      "Tempered Glass Screen Protector",
      "Fast Charger 65W",
      "USB-C Cable 2m",
      "Phone Tripod Stand",
      "Ring Light for Phone",
    ],
    priceMin: 5,
    priceMax: 1300,
  },
  "Audio & Headphones": {
    names: [
      "Noise-Cancelling Headphones",
      "True Wireless Earbuds",
      "Studio Monitor Headphones",
      "Bluetooth Speaker Outdoor",
      "Gaming Headset 7.1",
      "Soundbar 2.1ch",
      "Vinyl Record Player",
      "Lavalier Microphone",
    ],
    priceMin: 12,
    priceMax: 480,
  },
  "Home & Kitchen": {
    names: [
      "Air Fryer 6L",
      "Espresso Machine",
      "Stand Mixer 5qt",
      "Knife Set 8-piece",
      "Non-stick Cookware Set",
      "Smart Coffee Maker",
      "Insulated Water Bottle",
      "Bedsheet Set Queen",
    ],
    priceMin: 9,
    priceMax: 700,
  },
  "Fashion - Men": {
    names: [
      "Slim Fit Jeans",
      "Cotton Polo Shirt",
      "Leather Jacket",
      "Running Sneakers",
      "Wool Overcoat",
      "Casual Sneakers",
      "Linen Shirt",
      "Leather Belt",
    ],
    priceMin: 15,
    priceMax: 320,
  },
  "Fashion - Women": {
    names: [
      "Floral Summer Dress",
      "High-Waist Jeans",
      "Cashmere Sweater",
      "Leather Handbag",
      "Trench Coat",
      "Ankle Boots",
      "Linen Blouse",
      "Statement Earrings",
    ],
    priceMin: 12,
    priceMax: 380,
  },
  "Beauty & Personal Care": {
    names: [
      "Vitamin C Serum",
      "Hyaluronic Acid Moisturizer",
      "Sunscreen SPF50",
      "Hair Dryer Ionic",
      "Curling Wand",
      "Electric Toothbrush",
      "Facial Cleanser",
      "Lip Balm Set",
    ],
    priceMin: 6,
    priceMax: 220,
  },
  "Sports & Outdoors": {
    names: [
      "Yoga Mat 6mm",
      "Adjustable Dumbbells 50lb",
      "Camping Tent 4-person",
      "Trail Running Shoes",
      "Cycling Helmet",
      "Insulated Backpack 30L",
      "Resistance Bands Set",
      "Foam Roller",
    ],
    priceMin: 14,
    priceMax: 440,
  },
  "Books & Media": {
    names: [
      "The Pragmatic Programmer",
      "Designing Data-Intensive Applications",
      "Clean Architecture",
      "Atomic Habits",
      "Sapiens",
      "The Lean Startup",
      "Vinyl: Greatest Hits Vol.1",
      "Board Game: Catan",
    ],
    priceMin: 8,
    priceMax: 65,
  },
  "Toys & Games": {
    names: [
      "Building Bricks 500pc",
      "Remote-Control Car",
      "Plush Bear 30cm",
      "Educational Tablet",
      "Wooden Puzzle Set",
      "Chess Set Wooden",
      "Drone Mini Indoor",
      "Action Figure Collection",
    ],
    priceMin: 7,
    priceMax: 180,
  },
  "Health & Wellness": {
    names: [
      "Multivitamin 90-count",
      "Whey Protein 2lb",
      "Smart Scale",
      "Acupressure Mat",
      "Aromatherapy Diffuser",
      "Massage Gun",
      "Meditation Cushion",
      "Blood Pressure Monitor",
    ],
    priceMin: 11,
    priceMax: 260,
  },
};

const SHOPS = [
  { name: "TechHub Bangladesh", email: "vendor1@dokanxpress.dev" },
  { name: "UrbanThread", email: "vendor2@dokanxpress.dev" },
  { name: "Casa Mia", email: "vendor3@dokanxpress.dev" },
  { name: "WildPeak", email: "vendor4@dokanxpress.dev" },
  { name: "EverGlow", email: "vendor5@dokanxpress.dev" },
] as const;

// each shop "specializes" in some categories — gives them weighted distribution
const SHOP_AFFINITY: Record<string, CategoryName[]> = {
  "TechHub Bangladesh": [
    "Electronics",
    "Computers & Laptops",
    "Smartphones",
    "Audio & Headphones",
  ],
  UrbanThread: ["Fashion - Men", "Fashion - Women"],
  "Casa Mia": ["Home & Kitchen", "Books & Media"],
  WildPeak: ["Sports & Outdoors", "Toys & Games"],
  EverGlow: ["Beauty & Personal Care", "Health & Wellness"],
};

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

// ----- main seeding -----------------------------------------------------------

async function main() {
  console.log("seeding categories…");
  const categoryByName = new Map<string, { id: string; name: string }>();
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        image: `https://picsum.photos/seed/cat-${name.replace(/\W+/g, "")}/400/300`,
      },
    });
    categoryByName.set(name, cat);
  }

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
      update: {},
      create: {
        userId: vendor.id,
        shopName: shop.name,
        shopDetails: `${shop.name} — curated picks across the categories we love.`,
        shopLogo: `https://picsum.photos/seed/shop-${shop.name.replace(/\W+/g, "")}/200/200`,
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

  console.log("seeding products…");
  let productCount = 0;
  let flashSaleCount = 0;
  const productIds: string[] = [];

  for (const cat of CATEGORIES) {
    const tpl = CATEGORY_PRODUCTS[cat];
    // pick the shop that owns this category if any, else a random shop
    const owner =
      Object.entries(SHOP_AFFINITY).find(([, cats]) => cats.includes(cat))?.[0] ??
      pick(SHOPS).name;
    const shop = shopsByName.get(owner)!;
    const category = categoryByName.get(cat)!;

    for (let i = 0; i < tpl.names.length; i++) {
      const baseName = tpl.names[i];
      // 1-2 variants per template name → ~100 total products
      const variants = randInt(1, 2);
      for (let v = 0; v < variants; v++) {
        const name = variants === 1 ? baseName : `${baseName} v${v + 1}`;
        const price =
          Math.round(
            (tpl.priceMin + rand() * (tpl.priceMax - tpl.priceMin)) * 100,
          ) / 100;
        const isFlashSale = rand() < 0.18;
        if (isFlashSale) flashSaleCount++;
        const discountPct = isFlashSale ? randInt(10, 40) : null;
        const saleEnd = isFlashSale
          ? new Date(Date.now() + randInt(2, 14) * 24 * 60 * 60 * 1000)
          : null;
        const saleStart = isFlashSale ? new Date() : null;

        const stableSlug = `${shop.id.slice(0, 6)}-${name.replace(/\W+/g, "").toLowerCase()}`;

        // upsert by composite (name, shopId) — Product has no compound unique,
        // so emulate via findFirst + update or create
        const existing = await prisma.product.findFirst({
          where: { name, shopId: shop.id },
          select: { id: true },
        });

        const data: Prisma.ProductCreateInput = {
          name,
          description: `${name}. ${pick([
            "Built for everyday use",
            "A favorite among returning customers",
            "Designed with quality materials",
            "Engineered to last",
            "Loved by reviewers",
          ])}.`,
          price,
          inventory: randInt(30, 500),
          isFlashSale,
          discount_percentage: discountPct,
          sale_start_time: saleStart,
          sale_end_time: saleEnd,
          images: [productImage(stableSlug + "-1"), productImage(stableSlug + "-2")],
          category: { connect: { id: category.id } },
          shop: { connect: { id: shop.id } },
        };

        const product = existing
          ? await prisma.product.update({
              where: { id: existing.id },
              data: {
                description: data.description,
                price: data.price,
                inventory: data.inventory,
                isFlashSale: data.isFlashSale,
                discount_percentage: data.discount_percentage,
                sale_start_time: data.sale_start_time,
                sale_end_time: data.sale_end_time,
                images: data.images,
              },
            })
          : await prisma.product.create({ data });
        productIds.push(product.id);
        productCount++;
      }
    }
  }

  console.log("seeding reviews…");
  let reviewCount = 0;
  for (const productId of productIds) {
    const reviewers = randInt(5, 12);
    // each customer can review a product at most once → cap at customers length
    const eligible = [...customerRows].sort(() => rand() - 0.5).slice(0, Math.min(reviewers, customerRows.length));
    for (const customer of eligible) {
      try {
        await prisma.review.upsert({
          where: { userId_productId: { userId: customer.id, productId } },
          update: {},
          create: {
            userId: customer.id,
            productId,
            rating: weightedRating(),
            comment: pick(REVIEW_SNIPPETS),
          },
        });
        reviewCount++;
      } catch {
        // skip on duplicate, shouldn't happen with upsert but defensive
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
    `\nseed complete:\n  ${categoryByName.size} categories\n  ${shopsByName.size} shops/vendors\n  ${customerRows.length} customers\n  ${productCount} products (${flashSaleCount} on flash sale)\n  ${reviewCount} reviews\n  1 coupon (WELCOME15)`,
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
