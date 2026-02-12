#!/usr/bin/env tsx
/**
 * One-off fix for order_number column: increase varchar(20) → varchar(30).
 * Use this when full migration fails due to schema already existing.
 */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await sql.unsafe(`
      ALTER TABLE "orders" ALTER COLUMN "order_number" SET DATA TYPE varchar(30);
    `);
    console.log("✅ order_number column updated to varchar(30)");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
