/**
 * Scrapes product data + images from many real-world sources, plus the
 * current DB, and writes a single editable CSV. The user reviews the CSV
 * (deleting rows, fixing names/categories, swapping image URLs) and we then
 * re-seed from the edited CSV via prisma/data/seed-from-csv.ts.
 *
 * Sources:
 *   • Current Neon DB (preserves curated entries)
 *   • Wikipedia REST (flagship tech: phones, laptops, consoles, headphones)
 *   • Google Books (more subjects)
 *   • Open Beauty Facts (more pages)
 *   • Open Food Facts (groceries)
 *   • Public Shopify product feeds (Allbirds, Beardbrand, Kith, Oh Polly,
 *     Death Wish Coffee — real e-commerce stores with stable Shopify CDN
 *     images)
 *
 * Usage:
 *   npx tsx prisma/data/scrape-and-export.ts
 * Output:
 *   prisma/data/products.csv
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const prisma = new PrismaClient();

type Row = {
  source: string;
  product_id: string;
  suggested_category: string;
  suggested_shop: string;
  brand: string;
  name: string;
  image_1: string;
  image_2: string;
  image_3: string;
  price: string;
  description: string;
};

const empty = (): Row => ({
  source: "",
  product_id: "",
  suggested_category: "",
  suggested_shop: "",
  brand: "",
  name: "",
  image_1: "",
  image_2: "",
  image_3: "",
  price: "",
  description: "",
});

// ---------- Shop assignment per category ----------
const SHOP_FOR_CATEGORY: Record<string, string> = {
  Mobile: "TechHub Bangladesh",
  Electronics: "TechHub Bangladesh",
  "Computers & Laptops": "TechHub Bangladesh",
  "Home & Kitchen": "Casa Mia",
  Grocery: "Casa Mia",
  Books: "Casa Mia",
  "Skin Care": "EverGlow",
  Makeup: "EverGlow",
  Fragrances: "EverGlow",
  "Fashion - Men": "UrbanThread",
  "Fashion - Women": "UrbanThread",
  Watches: "UrbanThread",
  "Sports & Outdoor": "WildPeak",
  "Motorcycle Gear": "WildPeak",
};

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await p;
  } catch {
    return fallback;
  }
};

const stripHtml = (s: string) =>
  (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// ---------- 1. Current DB ----------
async function fromDb(): Promise<Row[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      images: true,
      price: true,
      category: { select: { name: true } },
      shop: { select: { shopName: true } },
      description: true,
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  return products.map((p) => ({
    source: "in_db",
    product_id: p.id,
    suggested_category: p.category?.name ?? "",
    suggested_shop: p.shop?.shopName ?? "",
    brand: "",
    name: p.name,
    image_1: p.images[0] ?? "",
    image_2: p.images[1] ?? "",
    image_3: p.images[2] ?? "",
    price: String(p.price),
    description: (p.description || "").slice(0, 250),
  }));
}

// ---------- 2. Wikipedia REST (flagship tech) ----------
type WikiPick = {
  page: string;
  category: string;
  brand: string;
  price: number;
};

const WIKI_TECH: WikiPick[] = [
  // Phones
  { page: "IPhone_15_Pro_Max", category: "Mobile", brand: "Apple", price: 1199 },
  { page: "IPhone_14_Pro", category: "Mobile", brand: "Apple", price: 999 },
  { page: "IPhone_13", category: "Mobile", brand: "Apple", price: 599 },
  { page: "Samsung_Galaxy_Z_Fold_5", category: "Mobile", brand: "Samsung", price: 1799 },
  { page: "Samsung_Galaxy_Z_Flip_5", category: "Mobile", brand: "Samsung", price: 999 },
  { page: "Samsung_Galaxy_S22_Ultra", category: "Mobile", brand: "Samsung", price: 899 },
  { page: "Google_Pixel_7_Pro", category: "Mobile", brand: "Google", price: 749 },
  { page: "Google_Pixel_Fold", category: "Mobile", brand: "Google", price: 1499 },
  { page: "Xiaomi_13_Ultra", category: "Mobile", brand: "Xiaomi", price: 999 },
  { page: "OnePlus_11", category: "Mobile", brand: "OnePlus", price: 699 },
  { page: "Huawei_Mate_60", category: "Mobile", brand: "Huawei", price: 999 },
  // Laptops + tablets
  { page: "MacBook_Pro_(Apple_silicon)", category: "Computers & Laptops", brand: "Apple", price: 1999 },
  { page: "Lenovo_Yoga", category: "Computers & Laptops", brand: "Lenovo", price: 1299 },
  { page: "Microsoft_Surface_Studio", category: "Computers & Laptops", brand: "Microsoft", price: 2999 },
  { page: "Acer_Aspire", category: "Computers & Laptops", brand: "Acer", price: 699 },
  { page: "Asus_ZenBook", category: "Computers & Laptops", brand: "ASUS", price: 1299 },
  // Consoles
  { page: "PlayStation_5", category: "Electronics", brand: "Sony", price: 499 },
  { page: "Xbox_Series_X", category: "Electronics", brand: "Microsoft", price: 499 },
  { page: "Nintendo_Switch_OLED_model", category: "Electronics", brand: "Nintendo", price: 349 },
  { page: "Steam_Deck", category: "Electronics", brand: "Valve", price: 549 },
  // Audio
  { page: "AirPods_Pro", category: "Electronics", brand: "Apple", price: 249 },
  { page: "AirPods_Max", category: "Electronics", brand: "Apple", price: 549 },
  { page: "Sony_WH-1000XM5", category: "Electronics", brand: "Sony", price: 399 },
  { page: "Bose_QuietComfort", category: "Electronics", brand: "Bose", price: 329 },
  // Wearables
  { page: "Apple_Watch_Series_9", category: "Watches", brand: "Apple", price: 399 },
  { page: "Apple_Watch_Ultra", category: "Watches", brand: "Apple", price: 799 },
  { page: "Samsung_Galaxy_Watch_6", category: "Watches", brand: "Samsung", price: 299 },
  { page: "Garmin_Forerunner", category: "Watches", brand: "Garmin", price: 399 },
];

async function fromWikipedia(): Promise<Row[]> {
  const out: Row[] = [];
  for (const item of WIKI_TECH) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.page)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DokanXpress/1.0 (catalog scraper)" },
      });
      if (!res.ok) {
        await sleep(150);
        continue;
      }
      const j = (await res.json()) as {
        title: string;
        extract?: string;
        thumbnail?: { source: string };
        originalimage?: { source: string };
      };
      const img = j.thumbnail?.source || j.originalimage?.source || "";
      if (!img || !j.extract) {
        await sleep(150);
        continue;
      }
      out.push({
        ...empty(),
        source: "wikipedia",
        suggested_category: item.category,
        suggested_shop: SHOP_FOR_CATEGORY[item.category] ?? "",
        brand: item.brand,
        name: j.title.replace(/_/g, " "),
        image_1: img,
        price: String(item.price),
        description: j.extract.slice(0, 250),
      });
      await sleep(180); // be polite to Wikipedia
    } catch {
      // skip
    }
  }
  return out;
}

// ---------- 3. Google Books (more subjects) ----------
const BOOK_SUBJECTS = [
  "computer science",
  "art",
  "philosophy",
  "psychology",
  "cooking",
  "travel",
];

async function fromGoogleBooks(): Promise<Row[]> {
  const out: Row[] = [];
  for (const subject of BOOK_SUBJECTS) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(subject)}&maxResults=10&printType=books&orderBy=relevance`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const j = (await res.json()) as {
        items?: {
          volumeInfo?: {
            title?: string;
            authors?: string[];
            description?: string;
            imageLinks?: { thumbnail?: string; smallThumbnail?: string };
          };
          saleInfo?: { listPrice?: { amount?: number } };
        }[];
      };
      for (const item of j.items ?? []) {
        const v = item.volumeInfo ?? {};
        const img =
          v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? "";
        if (!v.title || !img) continue;
        const price =
          item.saleInfo?.listPrice?.amount ?? Math.round(8 + Math.random() * 30);
        out.push({
          ...empty(),
          source: "google-books",
          suggested_category: "Books",
          suggested_shop: SHOP_FOR_CATEGORY.Books,
          brand: v.authors?.[0] ?? "Unknown author",
          name: v.title,
          image_1: img.replace(/^http:/, "https:"),
          price: String(price),
          description: (v.description ?? `${v.title} — a ${subject} book.`).slice(0, 250),
        });
      }
    } catch {
      // skip
    }
  }
  return out;
}

// ---------- 4. Open Beauty Facts ----------
async function fromBeautyFacts(): Promise<Row[]> {
  const out: Row[] = [];
  for (const cat of ["lipstick", "eye-shadow", "shampoo", "conditioner", "sunscreen"]) {
    try {
      const url = `https://world.openbeautyfacts.org/api/v2/search?categories_tags=${cat}&fields=product_name,brands,image_url,image_front_url,ingredients_text&page_size=10`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DokanXpress/1.0 (catalog scraper)" },
      });
      if (!res.ok) continue;
      const j = (await res.json()) as {
        products?: {
          product_name?: string;
          brands?: string;
          image_url?: string;
          image_front_url?: string;
          ingredients_text?: string;
        }[];
      };
      for (const item of j.products ?? []) {
        const name = (item.product_name ?? "").trim();
        const img = item.image_url || item.image_front_url || "";
        if (!name || !img) continue;
        const ourCat = ["shampoo", "conditioner", "sunscreen"].includes(cat)
          ? "Skin Care"
          : "Makeup";
        out.push({
          ...empty(),
          source: `beauty-facts:${cat}`,
          suggested_category: ourCat,
          suggested_shop: SHOP_FOR_CATEGORY[ourCat],
          brand: (item.brands ?? "").split(",")[0]?.trim() || "",
          name,
          image_1: img.replace(/^http:/, "https:"),
          price: String(Math.round(8 + Math.random() * 50)),
          description: (item.ingredients_text || `${name}. Curated beauty product.`).slice(0, 250),
        });
      }
    } catch {
      // skip
    }
  }
  return out;
}

// ---------- 5. Open Food Facts (groceries) ----------
async function fromFoodFacts(): Promise<Row[]> {
  const out: Row[] = [];
  for (const cat of ["snacks", "beverages", "breakfast-cereals", "chocolates", "pasta"]) {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags=${cat}&fields=product_name,brands,image_url,image_front_url,quantity&page_size=10&sort_by=popularity_key`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DokanXpress/1.0 (catalog scraper)" },
      });
      if (!res.ok) continue;
      const j = (await res.json()) as {
        products?: {
          product_name?: string;
          brands?: string;
          image_url?: string;
          image_front_url?: string;
          quantity?: string;
        }[];
      };
      for (const item of j.products ?? []) {
        const name = (item.product_name ?? "").trim();
        const img = item.image_url || item.image_front_url || "";
        if (!name || !img) continue;
        out.push({
          ...empty(),
          source: `food-facts:${cat}`,
          suggested_category: "Grocery",
          suggested_shop: SHOP_FOR_CATEGORY.Grocery,
          brand: (item.brands ?? "").split(",")[0]?.trim() || "",
          name,
          image_1: img.replace(/^http:/, "https:"),
          price: String((Math.round((1 + Math.random() * 12) * 100) / 100).toFixed(2)),
          description: `${name}${item.quantity ? ` (${item.quantity})` : ""}. Pantry essential.`.slice(0, 250),
        });
      }
    } catch {
      // skip
    }
  }
  return out;
}

// ---------- 6. Public Shopify stores ----------
type ShopifyStore = {
  url: string; // base store URL
  store: string; // short name for source column
  category: string; // our category for products from this store
};

const SHOPIFY_STORES: ShopifyStore[] = [
  { url: "https://www.allbirds.com", store: "allbirds", category: "Fashion - Men" },
  { url: "https://www.beardbrand.com", store: "beardbrand", category: "Skin Care" },
  { url: "https://kith.com", store: "kith", category: "Fashion - Men" },
  { url: "https://www.ohpolly.com", store: "ohpolly", category: "Fashion - Women" },
  { url: "https://www.deathwishcoffee.com", store: "deathwishcoffee", category: "Grocery" },
];

async function fromShopify(): Promise<Row[]> {
  const out: Row[] = [];
  for (const s of SHOPIFY_STORES) {
    try {
      const res = await fetch(`${s.url}/products.json?limit=30`, {
        headers: { "User-Agent": "Mozilla/5.0 (DokanXpress catalog scraper)" },
      });
      if (!res.ok) continue;
      const j = (await res.json()) as {
        products?: {
          title: string;
          vendor?: string;
          body_html?: string;
          images?: { src: string }[];
          variants?: { price?: string }[];
        }[];
      };
      for (const p of j.products ?? []) {
        const imgs = (p.images ?? [])
          .map((i) => i.src)
          .filter((u) => u && /^https:/.test(u));
        if (imgs.length === 0 || !p.title) continue;
        const price = parseFloat(p.variants?.[0]?.price ?? "0") || 0;
        out.push({
          ...empty(),
          source: `shopify:${s.store}`,
          suggested_category: s.category,
          suggested_shop: SHOP_FOR_CATEGORY[s.category] ?? "",
          brand: p.vendor || s.store,
          name: p.title.trim(),
          image_1: imgs[0] || "",
          image_2: imgs[1] || "",
          image_3: imgs[2] || "",
          price: String(price),
          description: stripHtml(p.body_html || p.title).slice(0, 250),
        });
      }
    } catch {
      // skip
    }
  }
  return out;
}

// ---------- CSV serializer ----------
const csvCell = (v: string) => {
  const s = v ?? "";
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const HEADER = [
  "source",
  "product_id",
  "suggested_category",
  "suggested_shop",
  "brand",
  "name",
  "image_1",
  "image_2",
  "image_3",
  "price",
  "description",
];

const toCsv = (rows: Row[]) => {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      HEADER.map((h) => csvCell((r as unknown as Record<string, string>)[h] ?? "")).join(","),
    );
  }
  return lines.join("\n");
};

// ---------- main ----------
async function main() {
  console.log("Fetching from all sources…");
  const [db, wiki, books, beauty, food, shopify] = await Promise.all([
    fromDb(),
    fromWikipedia(),
    fromGoogleBooks(),
    fromBeautyFacts(),
    fromFoodFacts(),
    fromShopify(),
  ]);
  console.log(
    `  → DB ${db.length} | Wiki ${wiki.length} | Books ${books.length} | Beauty ${beauty.length} | Food ${food.length} | Shopify ${shopify.length}`,
  );

  // Dedupe by name (case-insensitive). DB rows always win over scraped.
  const seen = new Set<string>();
  const all: Row[] = [];
  for (const r of [...db, ...wiki, ...books, ...beauty, ...food, ...shopify]) {
    const key = r.name.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    all.push(r);
  }

  const outPath = "prisma/data/products.csv";
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, toCsv(all), "utf8");
  console.log(`\nWrote ${all.length} rows to ${outPath}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
