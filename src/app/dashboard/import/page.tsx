import { getCurrentUserProfile } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import InstagramImportClient from "./InstagramImportClient";

export default async function InstagramImportPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <InstagramImportClient
      savedInstagramUsername={profile.instagramUsername || null}
      shopSlug={profile.shopSlug || profile.username}
    />
  );
}
