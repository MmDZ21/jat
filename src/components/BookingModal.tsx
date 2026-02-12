"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  CalendarDays,
  User,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots, getProfileAvailability, createBooking } from "@/app/actions/booking";
import type { AvailableSlot, AvailabilitySlotInput } from "@/app/actions/booking";
import { jsDayToPersianDay, TEHRAN_TZ } from "@/lib/time-utils";

// ─── Types ────────────────────────────────────────────────────────────────

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    price: string;
    durationMinutes: number | null;
    sellerId: string;
  };
  themeColor: string;
  textColor: string;
  backgroundMode: "light" | "dark";
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    card: string;
    input: string;
    overlay: string;
    drawer: string;
  };
  formatPrice: (price: string) => string;
}

type Step = 1 | 2 | 3;

// ─── Calendar helpers ─────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert to Saturday-first: Sat=0, Sun=1, ... Fri=6
  return day === 6 ? 0 : day + 1;
}

const PERSIAN_WEEKDAY_ABBR = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// ─── Component ────────────────────────────────────────────────────────────

export default function BookingModal({
  isOpen,
  onClose,
  service,
  themeColor,
  textColor,
  backgroundMode,
  colors,
  formatPrice,
}: BookingModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // "YYYY-MM-DD"
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [sellerAvailability, setSellerAvailability] = useState<AvailabilitySlotInput[]>([]);

  // Customer form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isBooking, startBooking] = useTransition();

  const duration = service.durationMinutes || 30;

  // Load seller availability on open
  useEffect(() => {
    if (isOpen) {
      getProfileAvailability(service.sellerId).then((res) => {
        if (res.success && res.data) {
          setSellerAvailability(res.data);
        }
      });
    }
  }, [isOpen, service.sellerId]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableSlots([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerNote("");
    }
  }, [isOpen]);

  // Available days of week (from seller availability, non-break, active)
  const availableDaysOfWeek = useMemo(() => {
    const days = new Set<number>();
    for (const slot of sellerAvailability) {
      if (!slot.isBreak && slot.isActive) {
        days.add(slot.dayOfWeek);
      }
    }
    return days;
  }, [sellerAvailability]);

  const handleDateSelect = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setIsLoadingSlots(true);

    try {
      const result = await getAvailableSlots(service.id, dateStr);
      if (result.success && result.slots) {
        setAvailableSlots(result.slots);
      } else {
        setAvailableSlots([]);
        if (result.error) toast.error(result.error);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }

    setStep(2);
  }, [service.id]);

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBooking = () => {
    if (!selectedSlot) return;

    startBooking(async () => {
      try {
        const result = await createBooking({
          serviceId: service.id,
          startTime: selectedSlot.startTime,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          customerNote: customerNote || undefined,
        });

        if (!result.success) {
          toast.error(result.error || "خطایی رخ داد");
          if (result.error?.includes("رزرو شده")) {
            // Refresh slots
            setStep(2);
            if (selectedDate) {
              setIsLoadingSlots(true);
              const refresh = await getAvailableSlots(service.id, selectedDate);
              setAvailableSlots(refresh.slots || []);
              setIsLoadingSlots(false);
            }
          }
          return;
        }

        toast.success("نوبت با موفقیت ثبت شد! در حال انتقال به درگاه پرداخت...");
        onClose();
        if (result.orderId) {
          router.push(`/checkout/mock-payment/${result.orderId}`);
        }
      } catch {
        toast.error("خطایی رخ داد");
      }
    });
  };

  // Calendar rendering
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayOffset = getFirstDayOffset(calYear, calMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthLabel = new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "long",
  }).format(calendarDate);

  const selectedDateDisplay = selectedDate
    ? new Intl.DateTimeFormat("fa-IR", {
        timeZone: TEHRAN_TZ,
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date(selectedDate + "T12:00:00Z"))
    : "";

  // Check if a day is available (seller works that day)
  const isDayAvailable = (dayNum: number) => {
    const dateObj = new Date(calYear, calMonth, dayNum);
    if (dateObj < today) return false;
    const jsDay = dateObj.getDay();
    const persianDay = jsDayToPersianDay(jsDay);
    return availableDaysOfWeek.has(persianDay);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: colors.overlay, backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            dir="rtl"
            style={{
              backgroundColor: colors.drawer,
              border: `1px solid ${colors.border}`,
              boxShadow: backgroundMode === "dark"
                ? `0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px ${colors.border}`
                : `0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px ${colors.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ backgroundColor: colors.drawer }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    <CalendarDays className="w-5 h-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: colors.text }}>
                      رزرو نوبت
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {service.name} • {new Intl.NumberFormat("fa-IR").format(duration)} دقیقه
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.textTertiary}30` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: themeColor }}
                      initial={{ width: "0%" }}
                      animate={{ width: step >= s ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5">
              <AnimatePresence mode="wait">
                {/* ═══════ STEP 1: Date Selection ═══════ */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs font-medium mb-3" style={{ color: colors.textSecondary }}>
                      تاریخ مورد نظر خود را انتخاب کنید
                    </p>

                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: colors.textSecondary }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${calYear}-${calMonth}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="text-sm font-bold"
                          style={{ color: colors.text }}
                        >
                          {monthLabel}
                        </motion.span>
                      </AnimatePresence>
                      <button
                        onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: colors.textSecondary }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 text-center mb-2">
                      {PERSIAN_WEEKDAY_ABBR.map((d) => (
                        <span key={d} className="text-xs font-medium py-1" style={{ color: colors.textTertiary }}>
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOffset }).map((_, i) => (
                        <div key={`e-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateObj = new Date(calYear, calMonth, dayNum);
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                        const isPast = dateObj < today;
                        const isAvailable = isDayAvailable(dayNum);
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateObj.toDateString() === today.toDateString();

                        const persianDay = new Intl.NumberFormat("fa-IR").format(dayNum);

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={isPast || !isAvailable}
                            onClick={() => handleDateSelect(dateStr)}
                            className="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 relative"
                            style={{
                              backgroundColor: isSelected
                                ? themeColor
                                : isToday
                                ? `${themeColor}15`
                                : "transparent",
                              color: isSelected
                                ? textColor
                                : isPast || !isAvailable
                                ? colors.textTertiary
                                : isToday
                                ? themeColor
                                : colors.text,
                              cursor: isPast || !isAvailable ? "default" : "pointer",
                              opacity: isPast ? 0.3 : !isAvailable ? 0.4 : 1,
                              boxShadow: isSelected
                                ? `0 4px 12px ${themeColor}40`
                                : "none",
                            }}
                          >
                            {persianDay}
                            {isAvailable && !isPast && !isSelected && (
                              <span
                                className="absolute bottom-1 w-1 h-1 rounded-full"
                                style={{ backgroundColor: themeColor }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ═══════ STEP 2: Slot Selection ═══════ */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-xs mb-3 transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      تغییر تاریخ
                    </button>

                    <div
                      className="rounded-xl px-3 py-2.5 mb-4 text-xs flex items-center gap-2"
                      style={{ backgroundColor: `${themeColor}10`, color: themeColor }}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span className="font-medium">{selectedDateDisplay}</span>
                    </div>

                    <p className="text-xs font-medium mb-3" style={{ color: colors.textSecondary }}>
                      ساعت مورد نظر را انتخاب کنید
                    </p>

                    {isLoadingSlots ? (
                      <div className="flex flex-col items-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: themeColor }} />
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          در حال بارگذاری...
                        </span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-10">
                        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textTertiary }} />
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          زمان خالی برای این تاریخ وجود ندارد
                        </p>
                        <button
                          onClick={() => setStep(1)}
                          className="mt-3 text-xs underline"
                          style={{ color: themeColor }}
                        >
                          انتخاب تاریخ دیگر
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
                        {availableSlots.map((slot) => {
                          const isChosen = selectedSlot?.startTime === slot.startTime;
                          return (
                            <motion.button
                              key={slot.startTime}
                              type="button"
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleSlotSelect(slot)}
                              className="py-3 px-2 rounded-xl text-sm font-medium text-center transition-all duration-150"
                              style={{
                                backgroundColor: isChosen ? themeColor : `${colors.textSecondary}08`,
                                color: isChosen ? textColor : colors.text,
                                border: `1px solid ${isChosen ? themeColor : colors.border}`,
                                boxShadow: isChosen ? `0 4px 12px ${themeColor}30` : "none",
                              }}
                            >
                              <span className="block text-base font-bold" dir="ltr">
                                {slot.displayStart}
                              </span>
                              <span className="block text-[10px] mt-0.5" style={{ color: isChosen ? `${textColor}cc` : colors.textTertiary }} dir="ltr">
                                تا {slot.displayEnd}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ═══════ STEP 3: Customer Info & Confirm ═══════ */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 text-xs mb-3 transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      تغییر ساعت
                    </button>

                    {/* Booking summary */}
                    <div
                      className="rounded-2xl p-4 mb-5"
                      style={{
                        backgroundColor: `${themeColor}08`,
                        border: `1px solid ${themeColor}20`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>خدمت</span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>{service.name}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>تاریخ</span>
                        <span className="text-sm font-medium" style={{ color: colors.text }}>{selectedDateDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>ساعت</span>
                        <span className="text-sm font-medium" style={{ color: colors.text }} dir="ltr">
                          {selectedSlot?.displayStart} — {selectedSlot?.displayEnd}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>مدت</span>
                        <span className="text-sm" style={{ color: colors.text }}>
                          {new Intl.NumberFormat("fa-IR").format(duration)} دقیقه
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: `${themeColor}20` }}>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>مبلغ</span>
                        <span className="text-base font-bold" style={{ color: themeColor }}>
                          {formatPrice(service.price)} تومان
                        </span>
                      </div>
                    </div>

                    {/* Customer form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleBooking();
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          <User className="w-3.5 h-3.5" />
                          نام و نام خانوادگی *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                          minLength={2}
                          disabled={isBooking}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: colors.input,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          <Phone className="w-3.5 h-3.5" />
                          شماره تماس *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          minLength={10}
                          disabled={isBooking}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: colors.input,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          <Mail className="w-3.5 h-3.5" />
                          ایمیل
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          disabled={isBooking}
                          placeholder="اختیاری"
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: colors.input,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          یادداشت
                        </label>
                        <textarea
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                          disabled={isBooking}
                          placeholder="اختیاری — مثلاً توضیحات خاص برای آرایشگر"
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 resize-none"
                          style={{
                            backgroundColor: colors.input,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isBooking}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mt-4"
                        style={{
                          backgroundColor: themeColor,
                          color: textColor,
                          boxShadow: `0 8px 20px ${themeColor}30`,
                        }}
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            در حال ثبت...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            تأیید و پرداخت — {formatPrice(service.price)} تومان
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
