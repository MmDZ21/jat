"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  Save,
  Coffee,
  CalendarClock,
} from "lucide-react";
import { iranYekan } from "@/app/fonts";
import { saveAvailability, type AvailabilitySlotInput } from "@/app/actions/booking";
import { updateWorkingHours } from "@/app/actions/settings";
import { PERSIAN_DAY_NAMES } from "@/lib/time-utils";

interface AvailabilityClientProps {
  initialSlots: AvailabilitySlotInput[];
  leadTimeHours: number;
}

interface DayConfig {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: { startTime: string; endTime: string }[];
}

const DEFAULT_DAY: DayConfig = {
  isOpen: false,
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 30,
  breaks: [],
};

const LEAD_TIME_OPTIONS = [
  { value: 0, label: "بدون محدودیت" },
  { value: 1, label: "۱ ساعت" },
  { value: 2, label: "۲ ساعت" },
  { value: 6, label: "۶ ساعت" },
  { value: 12, label: "۱۲ ساعت" },
  { value: 24, label: "۱ روز" },
  { value: 48, label: "۲ روز" },
];

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: "۱۵ دقیقه" },
  { value: 30, label: "۳۰ دقیقه" },
  { value: 45, label: "۴۵ دقیقه" },
  { value: 60, label: "۱ ساعت" },
  { value: 90, label: "۱.۵ ساعت" },
  { value: 120, label: "۲ ساعت" },
];

function slotsToConfig(slots: AvailabilitySlotInput[]): Record<number, DayConfig> {
  const config: Record<number, DayConfig> = {};
  for (let i = 0; i < 7; i++) {
    config[i] = { ...DEFAULT_DAY, breaks: [] };
  }

  for (const slot of slots) {
    const day = slot.dayOfWeek;
    if (!config[day]) config[day] = { ...DEFAULT_DAY, breaks: [] };

    if (slot.isBreak) {
      config[day].breaks.push({ startTime: slot.startTime, endTime: slot.endTime });
    } else {
      config[day].isOpen = slot.isActive;
      config[day].startTime = slot.startTime;
      config[day].endTime = slot.endTime;
      config[day].slotDuration = slot.slotDuration;
    }
  }

  return config;
}

function configToSlots(config: Record<number, DayConfig>): AvailabilitySlotInput[] {
  const slots: AvailabilitySlotInput[] = [];

  for (let day = 0; day < 7; day++) {
    const d = config[day];
    if (!d) continue;

    // Main work window
    slots.push({
      dayOfWeek: day,
      startTime: d.startTime,
      endTime: d.endTime,
      slotDuration: d.slotDuration,
      isBreak: false,
      isActive: d.isOpen,
    });

    // Breaks
    for (const brk of d.breaks) {
      slots.push({
        dayOfWeek: day,
        startTime: brk.startTime,
        endTime: brk.endTime,
        slotDuration: d.slotDuration,
        isBreak: true,
        isActive: true,
      });
    }
  }

  return slots;
}

export default function AvailabilityClient({
  initialSlots,
  leadTimeHours: initialLeadTime,
}: AvailabilityClientProps) {
  const [days, setDays] = useState<Record<number, DayConfig>>(slotsToConfig(initialSlots));
  const [leadTime, setLeadTime] = useState(initialLeadTime);
  const [isSaving, startSave] = useTransition();

  const updateDay = (dayIdx: number, updates: Partial<DayConfig>) => {
    setDays((prev) => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], ...updates },
    }));
  };

  const addBreak = (dayIdx: number) => {
    setDays((prev) => ({
      ...prev,
      [dayIdx]: {
        ...prev[dayIdx],
        breaks: [...prev[dayIdx].breaks, { startTime: "13:00", endTime: "14:00" }],
      },
    }));
  };

  const removeBreak = (dayIdx: number, breakIdx: number) => {
    setDays((prev) => ({
      ...prev,
      [dayIdx]: {
        ...prev[dayIdx],
        breaks: prev[dayIdx].breaks.filter((_, i) => i !== breakIdx),
      },
    }));
  };

  const updateBreak = (dayIdx: number, breakIdx: number, field: "startTime" | "endTime", value: string) => {
    setDays((prev) => ({
      ...prev,
      [dayIdx]: {
        ...prev[dayIdx],
        breaks: prev[dayIdx].breaks.map((b, i) => (i === breakIdx ? { ...b, [field]: value } : b)),
      },
    }));
  };

  const handleSave = () => {
    startSave(async () => {
      try {
        const slots = configToSlots(days);

        // Save availability slots
        const result = await saveAvailability(slots);
        if (!result.success) {
          toast.error(result.error || "خطایی رخ داد");
          return;
        }

        // Save working hours + lead time to profile
        const workingHoursMap: Record<string, { open: string; close: string; isOpen: boolean }> = {};
        const dayKeys = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
        for (let i = 0; i < 7; i++) {
          const d = days[i];
          workingHoursMap[dayKeys[i]] = {
            open: d.startTime,
            close: d.endTime,
            isOpen: d.isOpen,
          };
        }

        await updateWorkingHours({
          workingHours: workingHoursMap as Record<string, { open: string; close: string; isOpen: boolean }>,
          leadTimeHours: leadTime,
        });

        toast.success("ساعات کاری ذخیره شد");
      } catch {
        toast.error("خطایی رخ داد");
      }
    });
  };

  return (
    <div className={`min-h-screen bg-(--bg-base) ${iranYekan.className}`} dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به داشبورد
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-soft)" }}
            >
              <CalendarClock className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              ساعات کاری و نوبت‌دهی
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            روزها و ساعات کاری خود را تنظیم کنید تا مشتریان بتوانند نوبت رزرو کنند.
          </p>
        </motion.div>

        {/* Lead Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 mb-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              حداقل زمان قبل از رزرو
            </span>
          </div>
          <select
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            {LEAD_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Days */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx, i) => {
            const day = days[dayIdx];
            return (
              <motion.div
                key={dayIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.04 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${day.isOpen ? "var(--accent-soft)" : "var(--border-subtle)"}`,
                  boxShadow: day.isOpen ? "var(--shadow-card)" : "none",
                }}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateDay(dayIdx, { isOpen: !day.isOpen })}
                      className="relative w-12 h-7 rounded-full transition-colors duration-200"
                      style={{
                        background: day.isOpen ? "var(--accent)" : "var(--bg-overlay)",
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200"
                        style={{
                          transform: day.isOpen ? "translateX(-2px)" : "translateX(-26px)",
                        }}
                      />
                    </button>
                    <span
                      className="font-medium"
                      style={{
                        color: day.isOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                      }}
                    >
                      {PERSIAN_DAY_NAMES[dayIdx]}
                    </span>
                  </div>

                  {day.isOpen && (
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {day.startTime} — {day.endTime}
                    </span>
                  )}
                </div>

                {/* Expanded settings */}
                {day.isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-5 pb-5 space-y-4 border-t"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                          ساعت شروع
                        </label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDay(dayIdx, { startTime: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                          ساعت پایان
                        </label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDay(dayIdx, { endTime: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Slot Duration */}
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        مدت هر نوبت
                      </label>
                      <select
                        value={day.slotDuration}
                        onChange={(e) => updateDay(dayIdx, { slotDuration: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {SLOT_DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Breaks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <Coffee className="w-3.5 h-3.5" />
                          زمان استراحت
                        </span>
                        <button
                          type="button"
                          onClick={() => addBreak(dayIdx)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
                        >
                          <Plus className="w-3 h-3" />
                          افزودن
                        </button>
                      </div>

                      {day.breaks.length > 0 && (
                        <div className="space-y-2">
                          {day.breaks.map((brk, brkIdx) => (
                            <div key={brkIdx} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={brk.startTime}
                                onChange={(e) => updateBreak(dayIdx, brkIdx, "startTime", e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                                style={{
                                  background: "var(--bg-input)",
                                  border: "1px solid var(--border-default)",
                                  color: "var(--text-primary)",
                                }}
                              />
                              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>تا</span>
                              <input
                                type="time"
                                value={brk.endTime}
                                onChange={(e) => updateBreak(dayIdx, brkIdx, "endTime", e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                                style={{
                                  background: "var(--bg-input)",
                                  border: "1px solid var(--border-default)",
                                  color: "var(--text-primary)",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeBreak(dayIdx, brkIdx)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: "var(--error)" }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره ساعات کاری
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
