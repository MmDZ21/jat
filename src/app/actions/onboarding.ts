"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Check if a shop slug is available
 */
export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  message?: string;
}> {
  "use server";

  // Validate slug format (lowercase, alphanumeric, underscores, hyphens)
  const slugRegex = /^[a-z0-9_-]+$/;
  if (!slugRegex.test(slug)) {
    return {
      available: false,
      message: "فقط حروف انگلیسی کوچک، اعداد، خط تیره و زیرخط مجاز است",
    };
  }

  // Check minimum length
  if (slug.length < 3) {
    return {
      available: false,
      message: "حداقل 3 کاراکتر الزامی است",
    };
  }

  // Check if slug already exists
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.shopSlug, slug),
  });

  if (existing) {
    return {
      available: false,
      message: "این آدرس قبلاً استفاده شده است",
    };
  }

  return { available: true };
}

/**
 * Complete onboarding and set up user's shop
 */
export async function completeOnboarding(data: {
  shopName: string;
  shopSlug: string;
  instagramUsername?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "کاربر وارد نشده است" };
  }

  try {
    // Validate slug one more time
    const slugCheck = await checkSlugAvailability(data.shopSlug);
    if (!slugCheck.available) {
      return { success: false, error: slugCheck.message };
    }

    // Validate shop name
    if (!data.shopName.trim()) {
      return { success: false, error: "نام فروشگاه الزامی است" };
    }

    // Update profile
    await db
      .update(profiles)
      .set({
        shopName: data.shopName.trim(),
        shopSlug: data.shopSlug.toLowerCase().trim(),
        instagramUsername: data.instagramUsername?.trim() || null,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "خطا در ذخیره اطلاعات" };
  }
}

/**
 * Skip onboarding (optional - in case user wants to skip)
 */
export async function skipOnboarding(): Promise<{
  success: boolean;
  error?: string;
}> {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "کاربر وارد نشده است" };
  }

  try {
    // Get user's current username to use as slug
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile) {
      return { success: false, error: "پروفایل یافت نشد" };
    }

    // Use username as slug if not set
    await db
      .update(profiles)
      .set({
        shopSlug: profile.shopSlug || profile.username,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error skipping onboarding:", error);
    return { success: false, error: "خطا در ذخیره اطلاعات" };
  }
}
