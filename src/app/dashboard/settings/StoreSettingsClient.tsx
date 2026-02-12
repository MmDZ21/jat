"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { iranYekan } from "@/app/fonts";
import { updateProfileSettings } from "@/app/actions/settings";
import { updateThemeSettings } from "@/app/actions/theme";
import { getContrastColor } from "@/lib/color-utils";
import {
  Settings,
  Palette,
  Store,
  FileText,
  ToggleLeft,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";

interface StoreSettingsClientProps {
  initial: {
    shopName: string;
    accentColor: string;
    shopBio: string;
    isActive: boolean;
    themeColor: string;
    backgroundMode: "light" | "dark";
    profileId: string;
    cancellationWindowHours: number;
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

type Tab = "store" | "theme";

export default function StoreSettingsClient({
  initial,
}: StoreSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("store");

  // ── Store tab state ──
  const [shopName, setShopName] = useState(initial.shopName);
  const [shopBio, setShopBio] = useState(initial.shopBio);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(initial.cancellationWindowHours);
  const [isStorePending, startStoreTransition] = useTransition();

  // ── Theme tab state ──
  const [themeColor, setThemeColor] = useState(initial.themeColor);
  const [backgroundMode, setBackgroundMode] = useState<"light" | "dark">(
    initial.backgroundMode
  );
  const [savedThemeColor, setSavedThemeColor] = useState(initial.themeColor);
  const [savedBgMode, setSavedBgMode] = useState(initial.backgroundMode);
  const [isThemePending, startThemeTransition] = useTransition();

  const themeHasChanges =
    themeColor !== savedThemeColor || backgroundMode !== savedBgMode;

  // ── Handlers ──
  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startStoreTransition(async () => {
      const result = await updateProfileSettings({
        shopName,
        accentColor,
        shopBio,
        isActive,
        cancellationWindowHours,
      });
      if (result.success) {
        toast.success("تنظیمات فروشگاه با موفقیت ذخیره شد.");
      } else {
        toast.error(result.error || "خطا در ذخیره تنظیمات فروشگاه");
      }
    });
  };

  const handleThemeSave = () => {
    startThemeTransition(async () => {
      const result = await updateThemeSettings(
        initial.profileId,
        themeColor,
        backgroundMode
      );
      if (result.success) {
        setSavedThemeColor(themeColor);
        setSavedBgMode(backgroundMode);
        toast.success("تنظیمات تم با موفقیت ذخیره شد!");
      } else {
        toast.error(result.error || "خطا در ذخیره تنظیمات تم");
      }
    });
  };

  // ── Tab definitions ──
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "store",
      label: "فروشگاه",
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: "theme",
      label: "تم و ظاهر",
      icon: <Palette className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={`min-h-screen py-8 ${iranYekan.className}`}
      dir="rtl"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <div className="mb-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-medium transition-colors text-sm min-h-[44px]"
            style={{ color: "var(--accent-text)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--accent-text)")
            }
          >
            ← بازگشت به داشبورد
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Header */}
          <div
            className="p-6"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  boxShadow: "0 8px 16px var(--accent-glow)",
                }}
              >
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  تنظیمات فروشگاه
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  فروشگاه و ظاهر صفحه خود را مدیریت کنید
                </p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div
              className="flex p-1.5 mx-4 my-3 rounded-xl"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 rounded-lg min-h-[44px]"
                  style={{
                    backgroundColor:
                      activeTab === tab.id
                        ? "var(--accent-soft)"
                        : "transparent",
                    color:
                      activeTab === tab.id
                        ? "var(--accent-text)"
                        : "var(--text-secondary)",
                    border:
                      activeTab === tab.id
                        ? "1px solid rgba(139,92,246,0.2)"
                        : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* ───────── TAB 1: Store ───────── */}
            {activeTab === "store" && (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <form onSubmit={handleStoreSubmit} className="space-y-6">
                  {/* Shop name */}
                  <div>
                    <label
                      className="flex items-center gap-2 text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Store className="w-4 h-4" />
                      نام فروشگاه
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
                      placeholder="مثال: فروشگاه من"
                      maxLength={100}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-focus)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px var(--accent-soft)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Shop bio */}
                  <div>
                    <label
                      className="flex items-center gap-2 text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <FileText className="w-4 h-4" />
                      توضیحات فروشگاه
                    </label>
                    <textarea
                      value={shopBio}
                      onChange={(e) => setShopBio(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl outline-none resize-none transition-all"
                      rows={4}
                      placeholder="یک توضیح کوتاه درباره فروشگاه شما..."
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-focus)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px var(--accent-soft)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Vacation-mode toggle */}
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ToggleLeft
                        className="w-5 h-5"
                        style={{ color: "var(--text-secondary)" }}
                      />
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          فروشگاه فعال
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          در صورت غیرفعال بودن، پیام «فروشگاه موقتاً بسته
                          است» نمایش داده می‌شود.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => setIsActive((v) => !v)}
                      className="relative w-12 h-7 rounded-full transition-colors shrink-0"
                      style={{
                        minWidth: 48,
                        minHeight: 28,
                        backgroundColor: isActive
                          ? "var(--accent)"
                          : "var(--bg-hover)",
                        boxShadow: isActive
                          ? "0 0 12px var(--accent-glow)"
                          : "none",
                      }}
                    >
                      <span
                        className="absolute top-1 w-5 h-5 rounded-full shadow transition-transform"
                        style={{
                          backgroundColor: isActive
                            ? "#fff"
                            : "var(--text-tertiary)",
                          left: isActive ? "calc(100% - 24px)" : "4px",
                        }}
                      />
                    </button>
                  </div>

                  {/* Cancellation Window */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      بازه لغو نوبت
                    </label>
                    <p
                      className="text-xs mb-3"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      مشتری تا چند ساعت قبل از نوبت می‌تواند آن را لغو کند؟
                    </p>
                    <select
                      value={cancellationWindowHours}
                      onChange={(e) => setCancellationWindowHours(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontFamily: "inherit",
                      }}
                    >
                      <option value={2}>۲ ساعت قبل</option>
                      <option value={6}>۶ ساعت قبل</option>
                      <option value={12}>۱۲ ساعت قبل</option>
                      <option value={24}>۲۴ ساعت قبل (پیش‌فرض)</option>
                      <option value={48}>۴۸ ساعت قبل</option>
                      <option value={72}>۷۲ ساعت قبل</option>
                    </select>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isStorePending}
                      className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] disabled:opacity-50"
                      style={{
                        background: isStorePending
                          ? "var(--bg-hover)"
                          : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                        boxShadow: isStorePending
                          ? "none"
                          : "0 4px 16px var(--accent-glow)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isStorePending) {
                          e.currentTarget.style.boxShadow =
                            "0 8px 24px var(--accent-glow)";
                          e.currentTarget.style.transform =
                            "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isStorePending) {
                          e.currentTarget.style.boxShadow =
                            "0 4px 16px var(--accent-glow)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      {isStorePending ? (
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
              </motion.div>
            )}

            {/* ───────── TAB 2: Theme ───────── */}
            {activeTab === "theme" && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="space-y-6">
                  {/* Color picker */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      انتخاب رنگ سفارشی
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-24 h-24 rounded-xl cursor-pointer"
                          style={{
                            backgroundColor: themeColor,
                            border: "2px solid var(--border-default)",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all font-mono"
                          placeholder="#3b82f6"
                          maxLength={7}
                          style={{
                            backgroundColor: "var(--bg-input)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--border-focus)";
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px var(--accent-soft)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--border-default)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                        <p
                          className="text-xs mt-2"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          کد رنگ را به صورت Hex وارد کنید (مثال: #3b82f6)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preset colors */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      یا از رنگ‌های پیش‌فرض انتخاب کنید
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setThemeColor(preset.value)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 min-h-[44px]"
                          style={{
                            backgroundColor:
                              themeColor === preset.value
                                ? "var(--bg-hover)"
                                : "var(--bg-elevated)",
                            border:
                              themeColor === preset.value
                                ? `2px solid ${preset.value}`
                                : "2px solid var(--border-subtle)",
                            boxShadow:
                              themeColor === preset.value
                                ? `0 0 16px ${preset.value}30`
                                : "none",
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-lg"
                            style={{ backgroundColor: preset.value }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                themeColor === preset.value
                                  ? "var(--text-primary)"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background mode */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      حالت پس‌زمینه
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setBackgroundMode("light")}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-all min-h-[44px]"
                        style={{
                          backgroundColor:
                            backgroundMode === "light"
                              ? "var(--accent-soft)"
                              : "var(--bg-elevated)",
                          border:
                            backgroundMode === "light"
                              ? "2px solid var(--accent)"
                              : "2px solid var(--border-subtle)",
                          color:
                            backgroundMode === "light"
                              ? "var(--accent-text)"
                              : "var(--text-secondary)",
                          boxShadow:
                            backgroundMode === "light"
                              ? "0 0 16px var(--accent-glow)"
                              : "none",
                        }}
                      >
                        <Sun className="w-5 h-5" />
                        <span>روشن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackgroundMode("dark")}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-all min-h-[44px]"
                        style={{
                          backgroundColor:
                            backgroundMode === "dark"
                              ? "var(--accent-soft)"
                              : "var(--bg-elevated)",
                          border:
                            backgroundMode === "dark"
                              ? "2px solid var(--accent)"
                              : "2px solid var(--border-subtle)",
                          color:
                            backgroundMode === "dark"
                              ? "var(--accent-text)"
                              : "var(--text-secondary)",
                          boxShadow:
                            backgroundMode === "dark"
                              ? "0 0 16px var(--accent-glow)"
                              : "none",
                        }}
                      >
                        <Moon className="w-5 h-5" />
                        <span>تاریک</span>
                      </button>
                    </div>
                  </div>

                  {/* Live preview */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      پیش‌نمایش زنده
                    </label>
                    <div
                      className="rounded-xl p-6 space-y-4 transition-colors"
                      style={{
                        backgroundColor:
                          backgroundMode === "dark" ? "#1f2937" : "#f9fafb",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {/* Preview button */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          className="px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                          style={{
                            backgroundColor: themeColor,
                            color: getContrastColor(themeColor),
                            boxShadow:
                              backgroundMode === "dark"
                                ? `0 10px 15px -3px ${themeColor}60, 0 4px 6px -2px ${themeColor}40`
                                : `0 10px 15px -3px ${themeColor}40`,
                          }}
                        >
                          دکمه نمونه
                        </button>
                      </div>

                      {/* Preview tab */}
                      <div
                        className="flex gap-2 rounded-xl p-1.5 shadow-sm max-w-md mx-auto"
                        style={{
                          backgroundColor:
                            backgroundMode === "dark" ? "#374151" : "#ffffff",
                          border: `1px solid ${
                            backgroundMode === "dark" ? "#4b5563" : "#e5e7eb"
                          }`,
                        }}
                      >
                        <div
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium"
                          style={{
                            backgroundColor: themeColor,
                            color: getContrastColor(themeColor),
                          }}
                        >
                          <Palette className="w-5 h-5" />
                          <span>محصولات</span>
                        </div>
                        <div
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium"
                          style={{
                            color:
                              backgroundMode === "dark"
                                ? "#d1d5db"
                                : "#6b7280",
                          }}
                        >
                          <span>خدمات</span>
                        </div>
                      </div>

                      {/* Preview card */}
                      <div
                        className="rounded-xl p-4 max-w-md mx-auto"
                        style={{
                          backgroundColor:
                            backgroundMode === "dark" ? "#374151" : "#ffffff",
                          border: `1px solid ${
                            backgroundMode === "dark" ? "#4b5563" : "#e5e7eb"
                          }`,
                          boxShadow:
                            backgroundMode === "dark"
                              ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)"
                              : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className="font-bold"
                            style={{ color: themeColor }}
                          >
                            نمونه محصول
                          </h3>
                          <p
                            className="font-bold"
                            style={{ color: themeColor }}
                          >
                            ۵۰,۰۰۰ تومان
                          </p>
                        </div>
                        <p
                          className="text-sm"
                          style={{
                            color:
                              backgroundMode === "dark"
                                ? "#d1d5db"
                                : "#6b7280",
                          }}
                        >
                          این یک متن توضیحی نمونه برای محصول است
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleThemeSave}
                    disabled={!themeHasChanges || isThemePending}
                    className="w-full py-4 px-6 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px]"
                    style={{
                      background:
                        !themeHasChanges || isThemePending
                          ? "var(--bg-hover)"
                          : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                      color:
                        !themeHasChanges || isThemePending
                          ? "var(--text-tertiary)"
                          : "#fff",
                      boxShadow:
                        !themeHasChanges || isThemePending
                          ? "none"
                          : "0 4px 16px var(--accent-glow)",
                      cursor:
                        !themeHasChanges || isThemePending
                          ? "not-allowed"
                          : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (themeHasChanges && !isThemePending) {
                        e.currentTarget.style.boxShadow =
                          "0 8px 24px var(--accent-glow)";
                        e.currentTarget.style.transform =
                          "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (themeHasChanges && !isThemePending) {
                        e.currentTarget.style.boxShadow =
                          "0 4px 16px var(--accent-glow)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {isThemePending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : themeHasChanges ? (
                      <span>ذخیره تغییرات</span>
                    ) : (
                      <span>بدون تغییر</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
