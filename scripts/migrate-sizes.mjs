// Migration: Update all products from adult sizes (XS/S/M/L) to kids age-based sizes
// Run with: node scripts/migrate-sizes.mjs

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

// Mapping: ageGroup -> appropriate kids sizes
const AGE_GROUP_SIZES = {
  "0-2 Years":  ["0-6M", "6-12M", "1-2Y"],
  "3-5 Years":  ["2-3Y", "3-4Y", "4-5Y"],
  "6-8 Years":  ["5-6Y", "6-7Y", "7-8Y"],
  "9-12 Years": ["8-9Y", "9-10Y", "10-11Y", "11-12Y"],
};

// Old adult sizes we want to replace
const ADULT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);

function needsMigration(sizes) {
  return sizes.some((s) => ADULT_SIZES.has(s));
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database\n");

  const { rows: products } = await client.query(
    "SELECT id, name, age_group, sizes FROM products ORDER BY created_at"
  );

  console.log(`Found ${products.length} products total\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const oldSizes = product.sizes;
    const ageGroup = product.age_group;

    if (!needsMigration(oldSizes)) {
      console.log(`SKIP  "${product.name}" — already kids sizes: [${oldSizes.join(", ")}]`);
      skipped++;
      continue;
    }

    const newSizes = AGE_GROUP_SIZES[ageGroup] || AGE_GROUP_SIZES["3-5 Years"];

    await client.query(
      "UPDATE products SET sizes = $1, updated_at = NOW() WHERE id = $2",
      [newSizes, product.id]
    );

    console.log(`UPDATE "${product.name}"`);
    console.log(`   Age Group : ${ageGroup}`);
    console.log(`   Old Sizes : [${oldSizes.join(", ")}]`);
    console.log(`   New Sizes : [${newSizes.join(", ")}]\n`);
    updated++;
  }

  await client.end();
  console.log(`Done! Updated: ${updated}  |  Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
