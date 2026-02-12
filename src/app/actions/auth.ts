"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;

  // Check if username already exists
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });

  if (existingProfile) {
    return { error: "این نام کاربری قبلاً استفاده شده است" };
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        display_name: displayName || username,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!authData.user) {
    return { error: "خطا در ایجاد حساب کاربری" };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  return profile;
}

/**
 * Update Instagram username for the current user
 */
export async function updateInstagramUsername(username: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "کاربر وارد نشده است" };
  }

  try {
    await db
      .update(profiles)
      .set({
        instagramUsername: username,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    revalidatePath("/dashboard/import");
    return { success: true };
  } catch (error) {
    console.error("Error updating Instagram username:", error);
    return { success: false, error: "خطا در ذخیره نام کاربری اینستاگرام" };
  }
}

/**
 * Send a password reset email via Supabase Auth
 */
export async function resetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login?reset=true`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending reset email:", error);
    return { success: false, error: "خطا در ارسال ایمیل بازیابی" };
  }
}

/**
 * Check if the current user is authenticated (for login page redirect)
 */
export async function checkAuth(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
