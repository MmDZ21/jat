import "dotenv/config";
import { db } from "@/db";
import { profiles, items } from "@/db/schema";

async function seed() {
  try {
    console.log("🌱 Starting seed...");

    // Create a test profile
    const [profile] = await db
      .insert(profiles)
      .values({
        userId: "test-user-123",
        username: "ali_rezaei",
        displayName: "علی رضایی",
        bio: "فروشنده محصولات دیجیتال و خدمات طراحی گرافیک. بیش از 5 سال تجربه در زمینه طراحی وب و موبایل.",
        email: "ali@example.com",
        phone: "09123456789",
        isPublished: true,
        workingHours: {
          saturday: { open: "09:00", close: "18:00", isOpen: true },
          sunday: { open: "09:00", close: "18:00", isOpen: true },
          monday: { open: "09:00", close: "18:00", isOpen: true },
          tuesday: { open: "09:00", close: "18:00", isOpen: true },
          wednesday: { open: "09:00", close: "18:00", isOpen: true },
          thursday: { open: "09:00", close: "14:00", isOpen: true },
          friday: { open: "00:00", close: "00:00", isOpen: false },
          timezone: "Asia/Tehran",
        },
        leadTimeHours: 24,
        vacationMode: false,
      })
      .returning();

    console.log("✅ Profile created:", profile.username);

    // Create test products
    const products = await db
      .insert(items)
      .values([
        {
          sellerId: profile.id,
          type: "product",
          name: "دوره آموزش Next.js",
          description:
            "دوره جامع آموزش Next.js از صفر تا صد. شامل پروژه‌های عملی و پشتیبانی دائمی",
          price: "500000",
          stockQuantity: 10,
          isDigital: true,
          isActive: true,
          tags: ["آموزش", "برنامه‌نویسی", "Next.js"],
        },
        {
          sellerId: profile.id,
          type: "product",
          name: "تی‌شرت طرح کد",
          description: "تی‌شرت نخی با طرح‌های کدنویسی. کیفیت عالی و چاپ مقاوم",
          price: "150000",
          stockQuantity: 25,
          isDigital: false,
          isActive: true,
          tags: ["پوشاک", "کدنویسی"],
        },
        {
          sellerId: profile.id,
          type: "product",
          name: "پک استیکر برنامه‌نویس",
          description: "50 عدد استیکر با طرح‌های مختلف برنامه‌نویسی",
          price: "50000",
          stockQuantity: 0, // Out of stock
          isDigital: false,
          isActive: true,
          tags: ["استیکر", "هدیه"],
        },
      ])
      .returning();

    console.log(`✅ Created ${products.length} products`);

    // Create test services
    const services = await db
      .insert(items)
      .values([
        {
          sellerId: profile.id,
          type: "service",
          name: "مشاوره کسب‌وکار آنلاین",
          description:
            "یک ساعت مشاوره تخصصی برای راه‌اندازی کسب‌وکار آنلاین شما",
          price: "200000",
          durationMinutes: 60,
          isActive: true,
          tags: ["مشاوره", "کسب‌وکار"],
        },
        {
          sellerId: profile.id,
          type: "service",
          name: "طراحی لوگو",
          description:
            "طراحی لوگو حرفه‌ای با 3 کانسپت مختلف و تحویل فایل‌های وکتور",
          price: "800000",
          durationMinutes: 120,
          isActive: true,
          tags: ["طراحی", "لوگو", "برندینگ"],
        },
        {
          sellerId: profile.id,
          type: "service",
          name: "بررسی کد و رفع باگ",
          description: "بررسی کد شما و رفع باگ‌های احتمالی در پروژه",
          price: "300000",
          durationMinutes: 90,
          isActive: true,
          tags: ["برنامه‌نویسی", "باگ"],
        },
      ])
      .returning();

    console.log(`✅ Created ${services.length} services`);

    console.log("\n🎉 Seed completed successfully!");
    console.log(`\n🔗 Visit: http://localhost:3000/${profile.username}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
