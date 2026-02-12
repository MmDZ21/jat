import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";

interface ShopPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Check both shopSlug and username for backwards compatibility
  const profile = await db.query.profiles.findFirst({
    where: or(
      eq(profiles.shopSlug, slug),
      eq(profiles.username, slug),
    ),
  });

  if (!profile) {
    return {
      title: "فروشگاه یافت نشد | JAT",
      description: "این فروشگاه وجود ندارد یا منتشر نشده است",
    };
  }

  const title = `${profile.shopName || profile.displayName || profile.username} | JAT`;
  const description =
    profile.bio ||
    `فروشگاه ${profile.shopName || profile.displayName || profile.username} در JAT - لینک در بیو`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      ...(profile.avatarUrl && {
        images: [
          {
            url: profile.avatarUrl,
            width: 400,
            height: 400,
            alt: profile.displayName || profile.username,
          },
        ],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(profile.avatarUrl && {
        images: [profile.avatarUrl],
      }),
    },
    alternates: {
      canonical: `/shop/${slug}`,
    },
  };
}

