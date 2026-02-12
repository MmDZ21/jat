import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("Creating phone_verifications table...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS "phone_verifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "phone" varchar(20) NOT NULL,
      "code" varchar(6) NOT NULL,
      "expires_at" timestamp NOT NULL,
      "attempts" integer DEFAULT 0 NOT NULL,
      "verified" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "phone_verif_phone_idx" ON "phone_verifications" USING btree ("phone");
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "phone_verif_expires_idx" ON "phone_verifications" USING btree ("expires_at");
  `);

  console.log("phone_verifications table created successfully!");

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
