"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";

export type ProfileSettingsInput = {
  shopName: string;
  accentColor: string;
  shopBio: string;
  isActive: boolean;
};

export async function updateProfileSettings(
  data: ProfileSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { success: false, error: "کاربر احراز هویت نشده است" };
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(data.accentColor)) {
    return { success: false, error: "فرمت رنگ نامعتبر است (مثال: #3b82f6)" };
  }

  try {
    await db
      .update(profiles)
      .set({
        shopName: data.shopName.trim() || null,
        themeColor: data.accentColor,
        bio: data.shopBio.trim() || null,
        vacationMode: !data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile settings:", error);
    return { success: false, error: "خطایی در ذخیره تنظیمات رخ داد" };
  }
}
