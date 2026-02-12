import { Suspense } from "react";
import { getSellerOrders } from "@/app/actions/order-actions";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";
import { OrdersSkeleton } from "./OrdersSkeleton";

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const result = await getSellerOrders();
  const orders = result.orders ?? [];

  return <OrdersClient orders={orders} />;
}
