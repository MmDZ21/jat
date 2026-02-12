"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProfileSettings, type ProfileSettingsInput } from "@/app/actions/settings";
import { Settings, CheckCircle2, AlertCircle, Loader2, Store, Palette, FileText, ToggleLeft } from "lucide-react";

interface SettingsFormClientProps {
  initial: {
    shopName: string;
    accentColor: string;
    shopBio: string;
    isActive: boolean;
  };
}

const PRESET_COLORS = [
  { name: "آبی", value: "#3b82f6" },
  { name: "قرمز", value: "#ef4444" },
  { name: "سبز", value: "#10b981" },
  { name: "نارنجی", value: "#f59e0b" },
  { name: "بنفش", value: "#8b5cf6" },
  { name: "صورتی", value: "#ec4899" },
  { name: "فیروزه‌ای", value: "#06b6d4" },
  { name: "یاسی", value: "#6366f1" },
];

export default function SettingsFormClient({ initial }: SettingsFormClientProps) {
  const [shopName, setShopName] = useState(initial.shopName);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [shopBio, setShopBio] = useState(initial.shopBio);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const data: ProfileSettingsInput = {
      shopName,
      accentColor,
      shopBio,
      isActive,
    };
    startTransition(async () => {
      const result = await updateProfileSettings(data);
      if (result.success) {
        setMessage({ type: "success", text: "تنظیمات با موفقیت ذخیره شد." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error || "خطا در ذخیره" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
        >
          ← بازگشت به داشبورد
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">تنظیمات فروشگاه</h2>
              <p className="text-sm text-gray-500">نام، رنگ و وضعیت فروشگاه خود را مدیریت کنید</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Shop name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Store className="w-4 h-4" />
              نام فروشگاه
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="مثال: فروشگاه من"
              maxLength={100}
            />
          </div>

          {/* Accent color */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              رنگ تم فروشگاه
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                placeholder="#3b82f6"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAccentColor(c.value)}
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Shop bio */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              توضیحات فروشگاه
            </label>
            <textarea
              value={shopBio}
              onChange={(e) => setShopBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
              rows={4}
              placeholder="یک توضیح کوتاه درباره فروشگاه شما..."
            />
          </div>

          {/* Shop active toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">فروشگاه فعال</p>
                <p className="text-xs text-gray-500">
                  در صورت غیرفعال بودن، پیام «فروشگاه موقتاً بسته است» نمایش داده می‌شود.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isActive ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{
                  left: isActive ? "calc(100% - 20px - 4px)" : "4px",
                }}
              />
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره تنظیمات"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
