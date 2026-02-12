import { Suspense } from "react";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import DashboardClient from "./DashboardClient";
import { DashboardSkeleton } from "./DashboardSkeleton";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; count?: string }>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; count?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const showSuccess = params.import === "success";
  const importCount = params.count ? parseInt(params.count) : 0;

  const sellerItems = await db.query.items.findMany({
    where: eq(items.sellerId, profile.id),
    orderBy: (items, { desc }) => [desc(items.createdAt)],
  });

  return (
    <DashboardClient
      profile={profile}
      items={sellerItems}
      showImportSuccess={showSuccess}
      importCount={importCount}
    />
  );
}
