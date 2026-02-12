import { db } from "@/db";
import { profiles, items } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { generateMetadata } from "./metadata";
import ProfileClient from "@/app/[username]/ProfileClient";

// Re-export metadata generation
export { generateMetadata };

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds

interface ShopPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    payment?: string;
  }>;
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const paymentStatus = search?.payment;

  // Fetch profile with items in a single optimized query, by shopSlug or username (backwards-compatible)
  const profile = await db.query.profiles.findFirst({
    where: and(
      or(
        eq(profiles.shopSlug, slug),
        eq(profiles.username, slug),
      ),
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
      paymentStatus={paymentStatus}
    />
  );
}

