"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";

export async function updateThemeSettings(
  _profileId: string,
  themeColor: string,
  backgroundMode: "light" | "dark"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use authenticated user instead of trusting client-provided profileId
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(themeColor)) {
      return {
        success: false,
        error: "فرمت رنگ نامعتبر است",
      };
    }

    // Validate background mode
    if (backgroundMode !== "light" && backgroundMode !== "dark") {
      return {
        success: false,
        error: "حالت پس‌زمینه نامعتبر است",
      };
    }

    // Update theme settings in database using authenticated profile ID
    await db
      .update(profiles)
      .set({ 
        themeColor,
        backgroundMode,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    // Revalidate the shop page
    const slug = profile.shopSlug || profile.username;
    if (slug) {
      revalidatePath(`/shop/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating theme settings:", error);
    
    return {
      success: false,
      error: "خطایی در ذخیره تنظیمات رخ داد",
    };
  }
}
