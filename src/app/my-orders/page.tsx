import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerPhone } from "@/lib/phone-auth";
import { getCustomerBookingsAndOrders } from "@/app/actions/customer";
import MyOrdersClient from "./MyOrdersClient";

export const metadata: Metadata = {
  title: "سفارش‌های من | JAT",
  description: "مشاهده نوبت‌ها و سفارش‌ها",
};

export default async function MyOrdersPage() {
  const phone = await getCustomerPhone();

  if (!phone) {
    redirect("/track");
  }

  const result = await getCustomerBookingsAndOrders();

  return (
    <MyOrdersClient
      userPhone={phone}
      bookings={result.bookings || []}
      orders={result.orders || []}
    />
  );
}
