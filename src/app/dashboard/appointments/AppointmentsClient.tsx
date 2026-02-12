"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  List,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Phone,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  MessageSquare,
  CalendarX,
} from "lucide-react";
import { iranYekan } from "@/app/fonts";
import { updateBookingStatus, getSellerBookings } from "@/app/actions/booking";
import { formatPersianDate, formatPersianTime, formatPersianDateShort, TEHRAN_TZ } from "@/lib/time-utils";
import ConfirmModal from "@/components/ConfirmModal";

// ─── Types ────────────────────────────────────────────────────────────────

interface BookingRow {
  id: string;
  serviceName: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  startTime: string;
  endTime: string;
  status: string;
  orderId: string | null;
  createdAt: string;
}

interface AppointmentsClientProps {
  initialBookings: BookingRow[];
}

// ─── Status helpers ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "در انتظار تأیید", color: "var(--warning)", bg: "var(--warning-soft)" },
  confirmed: { label: "تأیید شده", color: "var(--accent)", bg: "var(--accent-soft)" },
  completed: { label: "انجام شده", color: "var(--success)", bg: "var(--success-soft)" },
  cancelled: { label: "لغو شده", color: "var(--error)", bg: "var(--error-soft)" },
  no_show: { label: "حاضر نشد", color: "var(--text-tertiary)", bg: "var(--bg-overlay)" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "confirmed", label: "تأیید شده" },
  { value: "completed", label: "انجام شده" },
  { value: "cancelled", label: "لغو شده" },
];

// ─── Component ────────────────────────────────────────────────────────────

// ─── Booking confirm modal descriptions ───────────────────────────────────

const BOOKING_STATUS_META: Record<string, { title: string; description: string; variant: "danger" | "warning" | "accent" | "success"; label: string }> = {
  confirmed: { title: "تأیید نوبت", description: "آیا از تأیید این نوبت مطمئن هستید؟ پس از تأیید، مشتری مطلع خواهد شد.", variant: "accent", label: "بله، تأیید کن" },
  completed: { title: "تکمیل نوبت", description: "آیا این نوبت با موفقیت انجام شده است؟", variant: "success", label: "بله، تکمیل شد" },
  cancelled: { title: "لغو نوبت", description: "آیا از لغو این نوبت مطمئن هستید؟ این عمل قابل بازگشت نیست.", variant: "danger", label: "بله، لغو کن" },
  no_show: { title: "عدم حضور مشتری", description: "آیا مشتری در زمان مقرر حاضر نشد؟", variant: "warning", label: "بله، حاضر نشد" },
};

export default function AppointmentsClient({ initialBookings }: AppointmentsClientProps) {
  const [bookingsList, setBookingsList] = useState<BookingRow[]>(initialBookings);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    newStatus: "confirmed" | "completed" | "cancelled" | "no_show";
  }>({ isOpen: false, bookingId: "", newStatus: "confirmed" });

  // Ref to store the pending action — immune to stale closures
  const pendingActionRef = useRef<{ bookingId: string; newStatus: "confirmed" | "completed" | "cancelled" | "no_show" } | null>(null);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  // Opens confirm modal instead of directly changing status
  const requestStatusChange = (bookingId: string, newStatus: "confirmed" | "completed" | "cancelled" | "no_show") => {
    pendingActionRef.current = { bookingId, newStatus };
    setConfirmModal({ isOpen: true, bookingId, newStatus });
  };

  // Executes the confirmed status change
  const executeStatusChange = async () => {
    const action = pendingActionRef.current;
    if (!action) return;
    const { bookingId, newStatus } = action;
    pendingActionRef.current = null;

    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (updatingId) return;
    setUpdatingId(bookingId);

    // Snapshot the current status before optimistic update (for revert)
    const previousStatus = bookingsList.find((b) => b.id === bookingId)?.status;

    // Optimistic update: immediately change the status in the UI
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    try {
      const result = await updateBookingStatus(bookingId, newStatus);
      if (!result.success) {
        toast.error(result.error || "خطایی رخ داد");
        // Revert optimistic update on failure using the snapshot
        if (previousStatus) {
          setBookingsList((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: previousStatus } : b))
          );
        }
        return;
      }
      toast.success(
        newStatus === "confirmed" ? "نوبت تأیید شد" :
        newStatus === "completed" ? "نوبت تکمیل شد" :
        newStatus === "cancelled" ? "نوبت لغو شد" :
        "وضعیت بروزرسانی شد"
      );

      // Refresh from server for accurate data
      const refreshResult = await getSellerBookings({ status: statusFilter === "all" ? undefined : statusFilter });
      if (refreshResult.success && refreshResult.data) {
        setBookingsList(refreshResult.data);
      }
    } catch {
      toast.error("خطایی رخ داد");
      // Revert on exception too
      if (previousStatus) {
        setBookingsList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: previousStatus } : b))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = statusFilter === "all"
    ? bookingsList
    : bookingsList.filter((b) => b.status === statusFilter);

  // Calendar helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  // Shift to Saturday-based week (6=Sat→0, 0=Sun→1, ..., 5=Fri→6)
  const startOffset = firstDayOfMonth === 6 ? 0 : firstDayOfMonth + 1;

  const monthLabel = new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "long",
  }).format(calendarDate);

  const prevMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));

  // Group bookings by date for calendar
  const bookingsByDate: Record<string, BookingRow[]> = {};
  for (const b of filtered) {
    const dateKey = new Date(b.startTime).toISOString().split("T")[0];
    if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
    bookingsByDate[dateKey].push(b);
  }

  // Upcoming / past separation
  const now = new Date();
  const upcoming = filtered
    .filter((b) => new Date(b.startTime) >= now && b.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = filtered
    .filter((b) => new Date(b.startTime) < now || b.status === "cancelled")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className={`min-h-screen bg-(--bg-base) ${iranYekan.className}`} dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به داشبورد
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-soft)" }}
              >
                <CalendarDays className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  نوبت‌ها
                </h1>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {filtered.length} نوبت
                </p>
              </div>
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-xl p-1"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <button
                onClick={() => setViewMode("list")}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: viewMode === "list" ? "var(--accent)" : "transparent",
                  color: viewMode === "list" ? "#fff" : "var(--text-secondary)",
                }}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: viewMode === "calendar" ? "var(--accent)" : "transparent",
                  color: viewMode === "calendar" ? "#fff" : "var(--text-secondary)",
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1"
        >
          <Filter className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className="h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: statusFilter === opt.value ? "var(--accent)" : "var(--bg-elevated)",
                color: statusFilter === opt.value ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${statusFilter === opt.value ? "var(--accent)" : "var(--border-subtle)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════════════════════ LIST VIEW ═══════════════════════ */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <Clock className="w-4 h-4" />
                  پیش رو ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((booking, i) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      index={i}
                      isUpdating={updatingId === booking.id}
                      onStatusChange={requestStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                  <CalendarX className="w-4 h-4" />
                  گذشته ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((booking, i) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      index={i}
                      isUpdating={updatingId === booking.id}
                      onStatusChange={requestStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <CalendarDays className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  هیچ نوبتی یافت نشد
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════════════════════ CALENDAR VIEW ═══════════════════════ */}
        {viewMode === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Calendar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <button onClick={nextMonth} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-secondary)" }}>
                <ChevronRight className="w-5 h-5" />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${calendarYear}-${calendarMonth}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {monthLabel}
                </motion.span>
              </AnimatePresence>
              <button onClick={prevMonth} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-secondary)" }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 text-center py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
                <span key={d} className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px p-2">
              {/* Empty cells for offset */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, dayNum) => {
                const day = dayNum + 1;
                const dateObj = new Date(calendarYear, calendarMonth, day);
                const dateKey = dateObj.toISOString().split("T")[0];
                const dayBookings = bookingsByDate[dateKey] || [];
                const isToday = dateObj.toDateString() === now.toDateString();

                return (
                  <div
                    key={day}
                    className="aspect-square flex flex-col items-center justify-start p-1 rounded-xl transition-colors"
                    style={{
                      background: isToday ? "var(--accent-soft)" : "transparent",
                    }}
                  >
                    <span
                      className="text-xs font-medium mb-0.5"
                      style={{
                        color: isToday ? "var(--accent)" : dayBookings.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                      }}
                    >
                      {new Intl.NumberFormat("fa-IR").format(day)}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {dayBookings.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_CONFIG[b.status]?.color || "var(--text-tertiary)" }}
                          />
                        ))}
                        {dayBookings.length > 3 && (
                          <span className="text-[8px]" style={{ color: "var(--text-tertiary)" }}>+</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirm Modal for status changes */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={BOOKING_STATUS_META[confirmModal.newStatus]?.title || "تغییر وضعیت"}
        description={BOOKING_STATUS_META[confirmModal.newStatus]?.description || "آیا مطمئن هستید؟"}
        confirmLabel={BOOKING_STATUS_META[confirmModal.newStatus]?.label || "تأیید"}
        variant={BOOKING_STATUS_META[confirmModal.newStatus]?.variant || "accent"}
        isLoading={!!updatingId}
        onConfirm={executeStatusChange}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────

function BookingCard({
  booking,
  index,
  isUpdating,
  onStatusChange,
}: {
  booking: BookingRow;
  index: number;
  isUpdating: boolean;
  onStatusChange: (id: string, status: "confirmed" | "completed" | "cancelled" | "no_show") => void;
}) {
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl p-5 transition-all"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top row: service + status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
            {booking.serviceName}
          </h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formatPersianDate(startDate)}</span>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Time */}
      <div
        className="flex items-center gap-4 text-xs mb-3 px-3 py-2.5 rounded-xl"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--text-primary)" }}>
            {formatPersianTime(startDate)} — {formatPersianTime(endDate)}
          </span>
        </div>
      </div>

      {/* Customer info */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-secondary)" }}>{booking.customerName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-secondary)" }} dir="ltr">{booking.customerPhone}</span>
        </div>
      </div>

      {/* Customer note */}
      {booking.customerNote && (
        <div className="flex items-start gap-1.5 text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: "var(--bg-input)" }}>
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-secondary)" }}>{booking.customerNote}</span>
        </div>
      )}

      {/* Actions */}
      {(booking.status === "pending" || booking.status === "confirmed") && (
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          {booking.status === "pending" && (
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "confirmed")}
              disabled={isUpdating}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              تأیید
            </button>
          )}
          {booking.status === "confirmed" && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(booking.id, "completed")}
                disabled={isUpdating}
                className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--success)", color: "#fff" }}
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                تکمیل
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(booking.id, "no_show")}
                disabled={isUpdating}
                className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                حاضر نشد
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onStatusChange(booking.id, "cancelled")}
            disabled={isUpdating}
            className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--error-soft)", color: "var(--error)" }}
          >
            <XCircle className="w-3.5 h-3.5" />
            لغو
          </button>
        </div>
      )}
    </motion.div>
  );
}
