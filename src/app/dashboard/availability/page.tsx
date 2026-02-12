import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { getSellerAvailability } from "@/app/actions/booking";
import AvailabilityClient from "./AvailabilityClient";

export default async function AvailabilityPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const result = await getSellerAvailability();

  return (
    <AvailabilityClient
      initialSlots={result.data || []}
      leadTimeHours={profile.leadTimeHours || 24}
    />
  );
}
