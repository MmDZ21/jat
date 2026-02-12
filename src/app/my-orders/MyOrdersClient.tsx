"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { iranYekan } from "@/app/fonts";
import { logoutCustomer } from "@/app/actions/phone-auth";
import {
  cancelBookingByCustomer,
  generateCalendarUrl,
  getCustomerBookingsAndOrders,
} from "@/app/actions/customer";
import type { CustomerBooking, CustomerOrder } from "@/app/actions/customer";
import ConfirmModal from "@/components/ConfirmModal";
import {
  CalendarDays,
  Clock,
  Package,
  LogOut,
  XCircle,
  CalendarPlus,
  Store,
  ChevronDown,
  ShoppingBag,
  CalendarX,
  Loader2,
  ExternalLink,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────

const TOKENS = {
  "--bg-base": "#0A0A0F",
  "--bg-surface": "#12121A",
  "--bg-elevated": "#1A1A25",
  "--bg-overlay": "#22222E",
  "--bg-input": "#14141D",
  "--border-subtle": "rgba(255,255,255,0.06)",
  "--border-default": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.12)",
  "--text-primary": "#EDEDF0",
  "--text-secondary": "#8B8B9E",
  "--text-tertiary": "#5C5C70",
  "--accent": "#8B5CF6",
  "--accent-soft": "rgba(139,92,246,0.12)",
  "--accent-text": "#A78BFA",
  "--success": "#34D399",
  "--success-soft": "rgba(52,211,153,0.12)",
  "--error": "#F87171",
  "--error-soft": "rgba(248,113,113,0.12)",
  "--warning": "#FBBF24",
  "--warning-soft": "rgba(251,191,36,0.12)",
} as React.CSSProperties;

// ─── Status Config ────────────────────────────────────────────────────────

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "در انتظار تأیید", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  confirmed: { label: "تأیید شده", color: "#A78BFA", bg: "rgba(139,92,246,0.12)" },
  completed: { label: "انجام شده", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  cancelled: { label: "لغو شده", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  no_show: { label: "حاضر نشد", color: "#5C5C70", bg: "rgba(92,92,112,0.12)" },
};

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  awaiting_approval: { label: "در انتظار تایید", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  approved: { label: "تایید شده", color: "#A78BFA", bg: "rgba(139,92,246,0.12)" },
  paid: { label: "پرداخت شده", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  processing: { label: "در حال آماده‌سازی", color: "#A78BFA", bg: "rgba(139,92,246,0.12)" },
  completed: { label: "تکمیل شده", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  cancelled: { label: "لغو شده", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  refunded: { label: "بازگشت وجه", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatPersianDate(isoStr: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoStr));
}

function formatPersianTime(isoStr: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoStr));
}

function formatPersianDateTime(isoStr: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoStr));
}

function formatPrice(price: string) {
  return new Intl.NumberFormat("fa-IR").format(parseFloat(price));
}

function hoursUntil(isoStr: string): number {
  return (new Date(isoStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

// ─── Tab Type ─────────────────────────────────────────────────────────────

type Tab = "bookings" | "orders";

// ─── Props ────────────────────────────────────────────────────────────────

interface MyOrdersClientProps {
  userPhone: string;
  bookings: CustomerBooking[];
  orders: CustomerOrder[];
}

// ─── Component ────────────────────────────────────────────────────────────

export default function MyOrdersClient({
  userPhone,
  bookings: initialBookings,
  orders: initialOrders,
}: MyOrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [bookingsList, setBookingsList] = useState(initialBookings);
  const [ordersList] = useState(initialOrders);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    bookingId: "",
  });
  const pendingCancelRef = useRef<string | null>(null);

  // ── Logout ──

  const handleLogout = async () => {
    await logoutCustomer();
    router.push("/track");
  };

  // ── Cancel Booking ──

  const requestCancel = (bookingId: string) => {
    pendingCancelRef.current = bookingId;
    setConfirmModal({ isOpen: true, bookingId });
  };

  const executeCancel = async () => {
    const bookingId = pendingCancelRef.current;
    if (!bookingId) return;
    pendingCancelRef.current = null;
    setConfirmModal({ isOpen: false, bookingId: "" });

    setCancellingId(bookingId);

    // Optimistic update
    const prevStatus = bookingsList.find((b) => b.id === bookingId)?.status;
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );

    try {
      const result = await cancelBookingByCustomer(bookingId);
      if (!result.success) {
        toast.error(result.error || "خطایی رخ داد");
        // Revert
        if (prevStatus) {
          setBookingsList((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: prevStatus } : b))
          );
        }
        return;
      }
      toast.success("نوبت با موفقیت لغو شد");

      // Refresh from server
      const refresh = await getCustomerBookingsAndOrders();
      if (refresh.success && refresh.bookings) {
        setBookingsList(refresh.bookings);
      }
    } catch {
      toast.error("خطایی رخ داد");
      if (prevStatus) {
        setBookingsList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: prevStatus } : b))
        );
      }
    } finally {
      setCancellingId(null);
    }
  };

  // ── Add to Calendar ──

  const handleAddToCalendar = async (bookingId: string) => {
    try {
      const result = await generateCalendarUrl(bookingId);
      if (result.success && result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error("خطا در ایجاد لینک تقویم");
      }
    } catch {
      toast.error("خطایی رخ داد");
    }
  };

  // ── Derived data ──

  const now = new Date();
  const upcomingBookings = bookingsList.filter(
    (b) => new Date(b.startTime) >= now && b.status !== "cancelled" && b.status !== "no_show" && b.status !== "completed"
  );
  const pastBookings = bookingsList.filter(
    (b) => new Date(b.startTime) < now || b.status === "cancelled" || b.status === "no_show" || b.status === "completed"
  );

  // ── Render ──

  return (
    <div
      dir="rtl"
      className={`${iranYekan.variable} min-h-screen`}
      style={{
        fontFamily: "var(--font-iran-yekan), system-ui, sans-serif",
        background: "var(--bg-base)",
        ...TOKENS,
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute top-[-15%] right-[10%] w-[35vw] h-[35vw] rounded-full blur-[120px]"
          style={{ background: "rgba(139,92,246,0.05)" }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-bold mb-1"
              style={{ color: "#EDEDF0" }}
            >
              سفارش‌های من
            </h1>
            <p className="text-xs" style={{ color: "#5C5C70" }}>
              {userPhone}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98]"
            style={{
              background: "#1A1A25",
              color: "#8B8B9E",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {([
            { key: "bookings" as Tab, label: "نوبت‌ها", icon: CalendarDays, count: upcomingBookings.length },
            { key: "orders" as Tab, label: "سفارش‌ها", icon: Package, count: ordersList.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 h-10 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                background: activeTab === tab.key ? "#1A1A25" : "transparent",
                color: activeTab === tab.key ? "#EDEDF0" : "#5C5C70",
                boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: activeTab === tab.key ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.06)",
                    color: activeTab === tab.key ? "#A78BFA" : "#5C5C70",
                  }}
                >
                  {new Intl.NumberFormat("fa-IR").format(tab.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "bookings" ? (
            <motion.div
              key="bookings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {bookingsList.length === 0 ? (
                <EmptyState
                  icon={CalendarX}
                  title="هنوز نوبتی ندارید"
                  description="می‌توانید از فروشگاه‌های موجود نوبت رزرو کنید"
                />
              ) : (
                <div className="space-y-6">
                  {/* Upcoming */}
                  {upcomingBookings.length > 0 && (
                    <div>
                      <h2
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ color: "#8B8B9E" }}
                      >
                        <Clock className="w-4 h-4" />
                        پیش رو ({new Intl.NumberFormat("fa-IR").format(upcomingBookings.length)})
                      </h2>
                      <div className="space-y-3">
                        {upcomingBookings.map((booking, i) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            index={i}
                            isCancelling={cancellingId === booking.id}
                            onCancel={requestCancel}
                            onAddToCalendar={handleAddToCalendar}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past */}
                  {pastBookings.length > 0 && (
                    <div>
                      <h2
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ color: "#5C5C70" }}
                      >
                        <CalendarX className="w-4 h-4" />
                        گذشته ({new Intl.NumberFormat("fa-IR").format(pastBookings.length)})
                      </h2>
                      <div className="space-y-3">
                        {pastBookings.map((booking, i) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            index={i}
                            isCancelling={false}
                            onCancel={requestCancel}
                            onAddToCalendar={handleAddToCalendar}
                            isPast
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {ordersList.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="هنوز سفارشی ندارید"
                  description="اولین خرید خود را از فروشگاه‌های موجود انجام دهید"
                />
              ) : (
                <div className="space-y-3">
                  {ordersList.map((order, i) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={i}
                      isExpanded={expandedOrder === order.id}
                      onToggle={() =>
                        setExpandedOrder(expandedOrder === order.id ? null : order.id)
                      }
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="لغو نوبت"
        description="آیا از لغو این نوبت مطمئن هستید؟ این عمل قابل بازگشت نیست."
        confirmLabel="بله، لغو کن"
        variant="danger"
        isLoading={!!cancellingId}
        onConfirm={executeCancel}
        onCancel={() => setConfirmModal({ isOpen: false, bookingId: "" })}
      />
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────

function BookingCard({
  booking,
  index,
  isCancelling,
  onCancel,
  onAddToCalendar,
  isPast = false,
}: {
  booking: CustomerBooking;
  index: number;
  isCancelling: boolean;
  onCancel: (id: string) => void;
  onAddToCalendar: (id: string) => void;
  isPast?: boolean;
}) {
  const statusCfg = BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
  const hours = hoursUntil(booking.startTime);
  const canCancel =
    !isPast &&
    (booking.status === "pending" || booking.status === "confirmed") &&
    hours >= booking.cancellationWindowHours;
  const showCancelDisabledMsg =
    !isPast &&
    (booking.status === "pending" || booking.status === "confirmed") &&
    hours < booking.cancellationWindowHours &&
    hours > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-2xl p-4"
      style={{
        background: "#12121A",
        border: "1px solid rgba(255,255,255,0.06)",
        opacity: isPast ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: "#EDEDF0" }}>
            {booking.serviceName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Store className="w-3 h-3 shrink-0" style={{ color: "#5C5C70" }} />
            <span className="text-xs truncate" style={{ color: "#8B8B9E" }}>
              {booking.sellerName}
            </span>
          </div>
        </div>
        <span
          className="text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0 mr-2"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Date/time */}
      <div
        className="flex items-center gap-4 mb-3 px-3 py-2.5 rounded-xl"
        style={{ background: "#0A0A0F" }}
      >
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" style={{ color: "#5C5C70" }} />
          <span className="text-xs" style={{ color: "#EDEDF0" }}>
            {formatPersianDate(booking.startTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: "#5C5C70" }} />
          <span className="text-xs" style={{ color: "#EDEDF0" }}>
            {formatPersianTime(booking.startTime)} - {formatPersianTime(booking.endTime)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isPast && (booking.status === "pending" || booking.status === "confirmed") && (
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Add to Calendar */}
          <button
            type="button"
            onClick={() => onAddToCalendar(booking.id)}
            className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
            style={{
              background: "rgba(139,92,246,0.12)",
              color: "#A78BFA",
            }}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            افزودن به تقویم
          </button>

          {/* Cancel */}
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}
            >
              {isCancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              لغو
            </button>
          )}
        </div>
      )}

      {/* Cancellation window message */}
      {showCancelDisabledMsg && (
        <p
          className="text-[10px] mt-2 px-2 py-1.5 rounded-lg text-center"
          style={{ background: "rgba(251,191,36,0.08)", color: "#FBBF24" }}
        >
          لغو فقط تا {new Intl.NumberFormat("fa-IR").format(booking.cancellationWindowHours)} ساعت
          قبل از نوبت امکان‌پذیر است
        </p>
      )}
    </motion.div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────

function OrderCard({
  order,
  index,
  isExpanded,
  onToggle,
}: {
  order: CustomerOrder;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusCfg = ORDER_STATUS[order.status] || ORDER_STATUS.awaiting_approval;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#12121A",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-3.5 h-3.5 shrink-0" style={{ color: "#5C5C70" }} />
              <span className="text-sm font-bold truncate" style={{ color: "#EDEDF0" }}>
                {order.sellerName}
              </span>
            </div>
            <p className="text-[11px]" dir="ltr" style={{ color: "#5C5C70" }}>
              {order.orderNumber}
            </p>
          </div>
          <span
            className="text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0 mr-2"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: "#8B8B9E" }}>
            {formatPersianDateTime(order.createdAt)}
          </span>
          <span className="text-sm font-bold" style={{ color: "#EDEDF0" }}>
            {formatPrice(order.totalAmount)} تومان
          </span>
        </div>

        {/* Expand button */}
        {order.items.length > 0 && (
          <button
            type="button"
            onClick={onToggle}
            className="w-full mt-3 h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
            style={{ background: "#0A0A0F", color: "#8B8B9E" }}
          >
            {isExpanded ? "بستن جزئیات" : `مشاهده اقلام (${new Intl.NumberFormat("fa-IR").format(order.items.length)})`}
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        )}
      </div>

      {/* Expanded items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-1 space-y-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: "#0A0A0F" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#EDEDF0" }}>
                      {item.itemName}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#8B8B9E" }}
                      >
                        x{new Intl.NumberFormat("fa-IR").format(item.quantity)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#8B8B9E" }}>
                    {formatPrice(item.subtotal)} تومان
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarX;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(139,92,246,0.08)" }}
      >
        <Icon className="w-8 h-8" style={{ color: "#5C5C70" }} />
      </div>
      <h3
        className="text-base font-bold mb-2"
        style={{ color: "#EDEDF0" }}
      >
        {title}
      </h3>
      <p
        className="text-sm mb-6 max-w-xs leading-relaxed"
        style={{ color: "#5C5C70" }}
      >
        {description}
      </p>
      <a
        href="/"
        className="h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA" }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        مشاهده فروشگاه‌ها
      </a>
    </motion.div>
  );
}
