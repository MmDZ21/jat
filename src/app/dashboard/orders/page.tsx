import { db } from "@/db";
import { getSellerOrders } from "@/app/actions/order-actions";
import OrdersClient from "./OrdersClient";


export default async function OrdersPage() {
  // پیدا کردن اولین پروفایل موجود برای تست بدون نیاز به لاگین
  const profile = await db.query.profiles.findFirst();
  const sellerId = profile?.id || "00000000-0000-0000-0000-000000000000";

  // Fetch orders for this seller
  const { orders } = await getSellerOrders(sellerId);

  return <OrdersClient orders={orders} sellerId={sellerId} />;
}
