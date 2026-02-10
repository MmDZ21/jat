import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("🚀 Running migrations...");

  // Create migration client (single connection)
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
