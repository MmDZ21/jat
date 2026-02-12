import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { getSellerBookings } from "@/app/actions/booking";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const result = await getSellerBookings();

  return (
    <AppointmentsClient
      initialBookings={result.data || []}
    />
  );
}
