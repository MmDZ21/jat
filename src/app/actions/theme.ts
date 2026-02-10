"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateThemeSettings(
  profileId: string,
  themeColor: string,
  backgroundMode: "light" | "dark"
): Promise<{ success: boolean; error?: string }> {
  try {
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

    // Update theme settings in database
    await db
      .update(profiles)
      .set({ 
        themeColor,
        backgroundMode,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    // Revalidate the profile page
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { username: true },
    });

    if (profile) {
      revalidatePath(`/${profile.username}`);
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
