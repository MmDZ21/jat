import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/auth";
import StoreSettingsClient from "./StoreSettingsClient";

export default async function SettingsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  return (
    <StoreSettingsClient
      initial={{
        shopName: profile.shopName ?? "",
        accentColor: profile.themeColor ?? "#3b82f6",
        shopBio: profile.bio ?? "",
        isActive: !profile.vacationMode,
        themeColor: profile.themeColor || "#3b82f6",
        backgroundMode: (profile.backgroundMode as "light" | "dark") || "light",
        profileId: profile.id,
        cancellationWindowHours: profile.cancellationWindowHours ?? 24,
      }}
    />
  );
}
