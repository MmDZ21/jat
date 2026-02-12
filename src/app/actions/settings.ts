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
  cancellationWindowHours?: number;
};

export type WorkingHoursInput = {
  workingHours: {
    saturday?: { open: string; close: string; isOpen: boolean };
    sunday?: { open: string; close: string; isOpen: boolean };
    monday?: { open: string; close: string; isOpen: boolean };
    tuesday?: { open: string; close: string; isOpen: boolean };
    wednesday?: { open: string; close: string; isOpen: boolean };
    thursday?: { open: string; close: string; isOpen: boolean };
    friday?: { open: string; close: string; isOpen: boolean };
    timezone?: string;
  };
  leadTimeHours: number;
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
    const updateData: Record<string, unknown> = {
      shopName: data.shopName.trim() || null,
      themeColor: data.accentColor,
      bio: data.shopBio.trim() || null,
      vacationMode: !data.isActive,
      updatedAt: new Date(),
    };

    if (data.cancellationWindowHours !== undefined) {
      const hours = Math.max(0, Math.min(168, data.cancellationWindowHours)); // Clamp 0-168h
      updateData.cancellationWindowHours = hours;
    }

    await db
      .update(profiles)
      .set(updateData)
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

export async function updateWorkingHours(
  data: WorkingHoursInput
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { success: false, error: "کاربر احراز هویت نشده است" };
  }

  try {
    await db
      .update(profiles)
      .set({
        workingHours: {
          ...data.workingHours,
          timezone: data.workingHours.timezone || "Asia/Tehran",
        },
        leadTimeHours: data.leadTimeHours,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);
    revalidatePath("/dashboard/availability");

    return { success: true };
  } catch (error) {
    console.error("Error updating working hours:", error);
    return { success: false, error: "خطایی در ذخیره ساعات کاری رخ داد" };
  }
}
