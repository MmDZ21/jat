import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ThemeSettingsClient from "@/components/ThemeSettingsClient";

export default async function ThemeSettingsPage() {
  // In a real app, get the user ID from auth session
  // For now, we'll use the test profile from seed
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, "ali_rezaei"),
  });

  if (!profile) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ThemeSettingsClient
        profileId={profile.id}
        currentThemeColor={profile.themeColor || "#3b82f6"}
        currentBackgroundMode={(profile.backgroundMode as "light" | "dark") || "light"}
      />
    </div>
  );
}
