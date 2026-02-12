import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import ShopSuccessClient from "@/components/ShopSuccessClient";

interface ShopSuccessPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    order?: string;
    phone?: string;
  }>;
}

export default async function ShopSuccessPage({ params, searchParams }: ShopSuccessPageProps) {
  const { slug } = await params;
  const { order: orderNumber, phone } = await searchParams;

  const profile = await db.query.profiles.findFirst({
    where: or(
      eq(profiles.shopSlug, slug),
      eq(profiles.username, slug),
    ),
  });

  if (!profile) {
    notFound();
  }

  return (
    <ShopSuccessClient
      shopSlug={slug}
      orderNumber={orderNumber ?? undefined}
      customerPhone={phone ?? undefined}
    />
  );
}
