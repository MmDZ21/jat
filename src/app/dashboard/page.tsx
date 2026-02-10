import AddItemForm from "@/components/AddItemForm";
import { db } from "@/db";
import Link from "next/link";

export default async function DashboardPage() {
  // پیدا کردن اولین پروفایل موجود برای تست بدون نیاز به لاگین
  const profile = await db.query.profiles.findFirst();
  const sellerId = profile?.id || "00000000-0000-0000-0000-000000000000";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex gap-4">
          <Link
            href="/dashboard/orders"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            📦 مدیریت سفارش‌ها
          </Link>
          <Link
            href="/dashboard/theme"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            🎨 تنظیمات تم
          </Link>
        </div>
      </div>
      <AddItemForm sellerId={sellerId} />
    </div>
  );
}