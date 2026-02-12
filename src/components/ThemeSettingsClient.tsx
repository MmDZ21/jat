"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateThemeSettings } from "@/app/actions/theme";
import { Palette, CheckCircle2, AlertCircle, Loader2, Sun, Moon } from "lucide-react";

interface ThemeSettingsClientProps {
  profileId: string;
  currentThemeColor: string;
  currentBackgroundMode: "light" | "dark";
}

export default function ThemeSettingsClient({
  profileId,
  currentThemeColor,
  currentBackgroundMode,
}: ThemeSettingsClientProps) {
  const [color, setColor] = useState(currentThemeColor);
  const [backgroundMode, setBackgroundMode] = useState<"light" | "dark">(currentBackgroundMode);
  const [savedColor, setSavedColor] = useState(currentThemeColor);
  const [savedMode, setSavedMode] = useState(currentBackgroundMode);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = color !== savedColor || backgroundMode !== savedMode;

  const handleSave = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateThemeSettings(profileId, color, backgroundMode);

      if (result.success) {
        setSavedColor(color);
        setSavedMode(backgroundMode);
        setMessage({ type: "success", text: "تنظیمات با موفقیت ذخیره شد!" });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error || "خطا در ذخیره تنظیمات" });
      }
    });
  };

  const presetColors = [
    { name: "آبی", value: "#3b82f6" },
    { name: "قرمز", value: "#ef4444" },
    { name: "سبز", value: "#10b981" },
    { name: "نارنجی", value: "#f59e0b" },
    { name: "بنفش", value: "#8b5cf6" },
    { name: "صورتی", value: "#ec4899" },
    { name: "فیروزه‌ای", value: "#06b6d4" },
    { name: "یاسی", value: "#6366f1" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
        >
          ← بازگشت به داشبورد
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">تنظیمات رنگ</h2>
              <p className="text-sm text-gray-500">رنگ برند خود را انتخاب کنید</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              انتخاب رنگ سفارشی
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-24 h-24 rounded-xl border-2 border-gray-200 cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-mono"
                  placeholder="#3b82f6"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-2">
                  کد رنگ را به صورت Hex وارد کنید (مثال: #3b82f6)
                </p>
              </div>
            </div>
          </div>

          {/* Preset Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              یا از رنگ‌های پیش‌فرض انتخاب کنید
            </label>
            <div className="grid grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                    color === preset.value
                      ? "border-gray-900 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: preset.value }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              حالت پس‌زمینه
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setBackgroundMode("light")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-all ${
                  backgroundMode === "light"
                    ? "bg-white border-2 border-gray-900 shadow-md"
                    : "bg-gray-100 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>روشن</span>
              </button>
              <button
                onClick={() => setBackgroundMode("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-all ${
                  backgroundMode === "dark"
                    ? "bg-gray-900 text-white border-2 border-gray-900 shadow-md"
                    : "bg-gray-100 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>تاریک</span>
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              پیش‌نمایش زنده
            </label>
            <div 
              className="rounded-xl p-6 space-y-4 transition-colors"
              style={{
                backgroundColor: backgroundMode === "dark" ? "#1f2937" : "#f9fafb",
              }}
            >
              {/* Preview Button */}
              <div className="flex justify-center">
                <button
                  className="px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: color,
                    color: getContrastColor(color),
                    boxShadow: backgroundMode === "dark"
                      ? `0 10px 15px -3px ${color}60, 0 4px 6px -2px ${color}40`
                      : `0 10px 15px -3px ${color}40`,
                  }}
                >
                  دکمه نمونه
                </button>
              </div>

              {/* Preview Tab */}
              <div 
                className="flex gap-2 rounded-xl p-1.5 shadow-sm max-w-md mx-auto border"
                style={{
                  backgroundColor: backgroundMode === "dark" ? "#374151" : "#ffffff",
                  borderColor: backgroundMode === "dark" ? "#4b5563" : "#e5e7eb",
                }}
              >
                <div
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium"
                  style={{
                    backgroundColor: color,
                    color: getContrastColor(color),
                  }}
                >
                  <Palette className="w-5 h-5" />
                  <span>محصولات</span>
                </div>
                <div 
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium"
                  style={{
                    color: backgroundMode === "dark" ? "#d1d5db" : "#6b7280",
                  }}
                >
                  <span>خدمات</span>
                </div>
              </div>

              {/* Preview Card */}
              <div 
                className="rounded-xl p-4 border max-w-md mx-auto"
                style={{
                  backgroundColor: backgroundMode === "dark" ? "#374151" : "#ffffff",
                  borderColor: backgroundMode === "dark" ? "#4b5563" : "#e5e7eb",
                  boxShadow: backgroundMode === "dark"
                    ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 
                    className="font-bold"
                    style={{ color: color }}
                  >
                    نمونه محصول
                  </h3>
                  <p className="font-bold" style={{ color: color }}>
                    ۵۰,۰۰۰ تومان
                  </p>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: backgroundMode === "dark" ? "#d1d5db" : "#6b7280" }}
                >
                  این یک متن توضیحی نمونه برای محصول است
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : hasChanges ? (
              <span>ذخیره تغییرات</span>
            ) : (
              <span>بدون تغییر</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { getContrastColor } from "@/lib/color-utils";
