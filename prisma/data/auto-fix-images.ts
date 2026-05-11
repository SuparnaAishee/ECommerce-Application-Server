/**
 * Auto-fix image quality across the catalog without manual editing.
 *
 *   1. Upgrade Wikipedia thumbnail URLs (320px) → originalimage (1024px+).
 *   2. Delete products whose image came from Platzi imgur (low-res scraper).
 *   3. Delete products whose image came from makeup-api.herokuapp.com
 *      (unreliable host — half the URLs eventually 404).
 *   4. Backfill Makeup + Skin Care with real product photos from Open
 *      Beauty Facts so the category doesn't shrink to nothing.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randInt = (a: number, b: number) =>
  Math.floor(Math.random() * (b - a + 1)) + a;

// ---------- 1. Upgrade Wikipedia thumbnails ----------
async function upgradeWikiThumbnails() {
  console.log("\n→ Upgrading Wikipedia thumbnails…");
  const wikiProducts = await prisma.product.findMany({
    where: { images: { has: "" } }, // sentinel — replaced below
    select: { id: true, name: true, images: true },
  });
  const all = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });
  const candidates = all.filter((p) =>
    (p.images?.[0] ?? "").includes("upload.wikimedia.org/wikipedia/commons/thumb/"),
  );
  console.log(`  found ${candidates.length} Wiki-thumb products`);

  let upgraded = 0;
  for (const p of candidates) {
    const thumbUrl = p.images[0];
    // Thumbnail URLs look like:
    //   .../commons/thumb/<a>/<b>/<filename>/<size>px-<filename>
    // Original is:
    //   .../commons/<a>/<b>/<filename>
    const match = thumbUrl.match(
      /upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/([^/]+)\/([^/]+)\/([^/]+)\/\d+px-/,
    );
    if (!match) continue;
    const [, a, b, filename] = match;
    const original = `https://upload.wikimedia.org/wikipedia/commons/${a}/${b}/${filename}`;
    await prisma.product.update({
      where: { id: p.id },
      data: { images: [original, ...p.images.slice(1)] },
    });
    upgraded++;
  }
  console.log(`  ✓ upgraded ${upgraded} thumbnails`);
  // suppress unused
  void wikiProducts;
}

// ---------- 2 + 3. Delete weak-source products ----------
async function deleteWeakSources() {
  console.log("\n→ Deleting weak-image products…");
  const all = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });
  const weak = all.filter((p) => {
    const url = p.images?.[0] ?? "";
    return (
      url.includes("i.imgur.com") ||
      url.includes("makeup-api.herokuapp.com")
    );
  });
  console.log(`  found ${weak.length} weak-source products`);

  // Wipe related rows first to clear FKs
  const ids = weak.map((p) => p.id);
  if (ids.length > 0) {
    await prisma.review.deleteMany({ where: { productId: { in: ids } } });
    await prisma.cart.deleteMany({ where: { productId: { in: ids } } });
    await prisma.wishlist.deleteMany({ where: { productId: { in: ids } } });
    await prisma.comparison.deleteMany({ where: { productId: { in: ids } } });
    await prisma.order.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  }
  console.log(`  ✓ deleted ${weak.length} products`);
}

// ---------- 4. Backfill from Open Beauty Facts ----------
type BeautyItem = {
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  ingredients_text?: string;
};

async function fetchBeauty(category: string, pageSize = 25): Promise<{
  name: string;
  brand: string;
  image: string;
  description: string;
}[]> {
  try {
    const url = `https://world.openbeautyfacts.org/api/v2/search?categories_tags=${encodeURIComponent(
      category,
    )}&fields=product_name,brands,image_url,image_front_url,ingredients_text&page_size=${pageSize}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DokanXpress/1.0 (catalog backfill)" },
    });
    if (!res.ok) return [];
    const j = (await res.json()) as { products?: BeautyItem[] };
    return (j.products ?? [])
      .map((it) => ({
        name: (it.product_name ?? "").trim(),
        brand: (it.brands ?? "").split(",")[0]?.trim() || "Beauty Co.",
        image:
          (it.image_url || it.image_front_url || "").replace(/^http:/, "https:"),
        description: (
          it.ingredients_text || `${it.product_name} — picked for your routine.`
        ).slice(0, 400),
      }))
      .filter((p) => p.name && p.image && /^https:/.test(p.image));
  } catch {
    return [];
  }
}

async function backfillCategory(opts: {
  categoryName: string;
  shopName: string;
  beautyCategories: string[];
  targetCount: number;
}) {
  console.log(`\n→ Backfilling ${opts.categoryName}…`);
  const cat = await prisma.category.findFirst({
    where: { name: opts.categoryName },
  });
  const shop = await prisma.shop.findFirst({
    where: { shopName: opts.shopName },
  });
  if (!cat || !shop) {
    console.log(`  ✗ category or shop not found`);
    return;
  }

  const existingNames = new Set(
    (
      await prisma.product.findMany({
        where: { categoryId: cat.id },
        select: { name: true },
      })
    ).map((p) => p.name.toLowerCase()),
  );
  const currentCount = existingNames.size;
  const needed = Math.max(0, opts.targetCount - currentCount);
  console.log(`  has ${currentCount}, target ${opts.targetCount}, need ${needed}`);
  if (needed === 0) return;

  const pool: { name: string; brand: string; image: string; description: string }[] = [];
  for (const bc of opts.beautyCategories) {
    const items = await fetchBeauty(bc, 25);
    for (const it of items) {
      if (existingNames.has(it.name.toLowerCase())) continue;
      if (pool.some((p) => p.name.toLowerCase() === it.name.toLowerCase())) continue;
      pool.push(it);
    }
    await sleep(200); // be polite
  }
  console.log(`  fetched ${pool.length} candidates`);

  let created = 0;
  for (const item of pool.slice(0, needed)) {
    try {
      const data: Prisma.ProductCreateInput = {
        name: item.name,
        description: item.description,
        price: Number((randInt(8, 75) + Math.random()).toFixed(2)),
        inventory: randInt(20, 220),
        isFlashSale: false,
        images: [item.image],
        category: { connect: { id: cat.id } },
        shop: { connect: { id: shop.id } },
      };
      await prisma.product.create({ data });
      created++;
    } catch {
      // skip duplicates etc.
    }
  }
  console.log(`  ✓ created ${created} new products`);
}

// ---------- main ----------
async function main() {
  await upgradeWikiThumbnails();
  await deleteWeakSources();

  await backfillCategory({
    categoryName: "Makeup",
    shopName: "EverGlow",
    beautyCategories: [
      "lipsticks",
      "eye-shadows",
      "mascaras",
      "blushes",
      "eyeliners",
      "lip-glosses",
      "foundations",
    ],
    targetCount: 30,
  });

  await backfillCategory({
    categoryName: "Skin Care",
    shopName: "EverGlow",
    beautyCategories: [
      "moisturizers",
      "serums",
      "cleansers",
      "toners",
      "face-masks",
      "sunscreens",
    ],
    targetCount: 25,
  });

  // Final report
  const cats = await prisma.category.findMany({
    select: { name: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\n=== Final catalog ===");
  for (const c of cats) console.log(`  ${c.name.padEnd(22)} ${c._count.products}`);
  const total = await prisma.product.count();
  console.log(`\nTotal products: ${total}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
