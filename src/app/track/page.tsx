import { Suspense } from "react";
import type { Metadata } from "next";
import TrackClient from "./TrackClient";

export const metadata: Metadata = {
  title: "پیگیری سفارش | JAT",
  description: "ورود به پنل مشتری با شماره موبایل",
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" dir="rtl">در حال بارگذاری...</div>}>
      <TrackClient />
    </Suspense>
  );
}
