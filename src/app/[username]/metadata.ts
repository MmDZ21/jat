import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });

  if (!profile) {
    return {
      title: "پروفایل یافت نشد | JAT",
      description: "این صفحه وجود ندارد یا حذف شده است",
    };
  }

  const title = `${profile.displayName || profile.username} | JAT`;
  const description = profile.bio || `صفحه ${profile.displayName || profile.username} در JAT - لینک در بیو`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
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
      canonical: `/${username}`,
    },
  };
}

// Enable static generation for popular profiles (optional)
export const dynamic = "force-dynamic"; // or 'auto' for ISR
export const revalidate = 60; // Revalidate every 60 seconds (ISR)
