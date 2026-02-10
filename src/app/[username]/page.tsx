import { db } from "@/db";
import { profiles, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { generateMetadata } from "./metadata";
import ProfileClient from "./ProfileClient";

// Re-export metadata generation
export { generateMetadata };

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Fetch profile with items in a single optimized query
  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.username, username),
      eq(profiles.isPublished, true)
    ),
    with: {
      items: {
        where: eq(items.isActive, true),
        orderBy: (items, { asc }) => [asc(items.sortOrder), asc(items.createdAt)],
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Separate products and services
  const products = profile.items.filter((item) => item.type === "product");
  const services = profile.items.filter((item) => item.type === "service");

  return (
    <ProfileClient
      profile={profile}
      products={products}
      services={services}
    />
  );
}
