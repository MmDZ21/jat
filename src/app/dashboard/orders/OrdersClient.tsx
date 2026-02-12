"use client";

import { useState, useRef } from "react";
import { updateOrderStatus } from "@/app/actions/order-actions";
import { iranYekan } from "@/app/fonts";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Package } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OrderStatus =
  | "awaiting_approval"
  | "approved"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

interface OrderItem {
  id: string;
  itemName: string;
  itemType: "product" | "service";
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string | null;
  postalCode: string | null;
  status: OrderStatus;
  totalAmount: string;
  createdAt: Date;
  orderItems: OrderItem[];
}

interface OrdersClientProps {
  orders: Order[];
}

/* ------------------------------------------------------------------ */
/*  CSS-var driven status palette                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    color: string;       // foreground (CSS var value)
    bgColor: string;     // soft bg (CSS var value)
    dotColor: string;    // solid dot
    actions: OrderStatus[];
  }
> = {
  awaiting_approval: {
    label: "در انتظار تایید",
    color: "var(--warning)",
    bgColor: "var(--warning-soft)",
    dotColor: "var(--warning)",
    actions: ["approved", "cancelled"],
  },
  approved: {
    label: "تایید شده",
    color: "var(--accent)",
    bgColor: "var(--accent-soft)",
    dotColor: "var(--accent)",
    actions: ["processing", "cancelled"],
  },
  paid: {
    label: "پرداخت شده",
    color: "var(--success)",
    bgColor: "var(--success-soft)",
    dotColor: "var(--success)",
    actions: ["processing"],
  },
  processing: {
    label: "در حال آماده‌سازی",
    color: "var(--accent-text)",
    bgColor: "var(--accent-soft)",
    dotColor: "var(--accent-text)",
    actions: ["completed"],
  },
  completed: {
    label: "تکمیل شده",
    color: "var(--success)",
    bgColor: "var(--success-soft)",
    dotColor: "var(--success)",
    actions: [],
  },
  cancelled: {
    label: "لغو شده",
    color: "var(--error)",
    bgColor: "var(--error-soft)",
    dotColor: "var(--error)",
    actions: [],
  },
  refunded: {
    label: "بازگشت وجه",
    color: "var(--warning)",
    bgColor: "var(--warning-soft)",
    dotColor: "var(--warning)",
    actions: [],
  },
};

const actionLabels: Record<OrderStatus, string> = {
  awaiting_approval: "در انتظار تایید",
  approved: "تایید سفارش",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شدن",
  cancelled: "لغو",
  refunded: "بازگشت وجه",
};

/* ------------------------------------------------------------------ */
/*  Motion variants                                                    */
/* ------------------------------------------------------------------ */

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Order confirm modal descriptions                                    */
/* ------------------------------------------------------------------ */

const ORDER_STATUS_META: Record<OrderStatus, { title: string; description: string; variant: "danger" | "warning" | "accent" | "success"; label: string }> = {
  awaiting_approval: { title: "در انتظار تایید", description: "", variant: "warning", label: "تأیید" },
  approved: { title: "تایید سفارش", description: "آیا از تایید این سفارش مطمئن هستید؟ مشتری از تایید سفارش مطلع خواهد شد.", variant: "accent", label: "بله، تایید کن" },
  paid: { title: "پرداخت شده", description: "آیا پرداخت این سفارش را تایید می‌کنید؟", variant: "success", label: "بله، تایید پرداخت" },
  processing: { title: "شروع آماده‌سازی", description: "آیا آماده‌سازی این سفارش را شروع می‌کنید؟", variant: "accent", label: "بله، شروع آماده‌سازی" },
  completed: { title: "تکمیل سفارش", description: "آیا این سفارش با موفقیت تکمیل شده است؟", variant: "success", label: "بله، تکمیل شد" },
  cancelled: { title: "لغو سفارش", description: "آیا از لغو این سفارش مطمئن هستید؟ این عمل قابل بازگشت نیست.", variant: "danger", label: "بله، لغو کن" },
  refunded: { title: "بازگشت وجه", description: "آیا از بازگشت وجه این سفارش مطمئن هستید؟", variant: "warning", label: "بله، بازگشت وجه" },
};

export default function OrdersClient({ orders }: OrdersClientProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    orderId: string;
    newStatus: OrderStatus;
  }>({ isOpen: false, orderId: "", newStatus: "awaiting_approval" });

  // Ref to store the pending action — immune to stale closures
  const pendingActionRef = useRef<{ orderId: string; newStatus: OrderStatus } | null>(null);

  /* ---------- handlers ---------- */

  // Opens confirm modal instead of directly changing status
  const requestStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    pendingActionRef.current = { orderId, newStatus };
    setConfirmModal({ isOpen: true, orderId, newStatus });
  };

  // Executes the confirmed status change
  const executeStatusUpdate = async () => {
    const action = pendingActionRef.current;
    if (!action) return;
    const { orderId, newStatus } = action;
    pendingActionRef.current = null;

    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    setIsUpdating(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success("وضعیت سفارش به‌روزرسانی شد");
      } else {
        toast.error(result.error || "خطا در به‌روزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("خطا در به‌روزرسانی وضعیت");
    } finally {
      setIsUpdating(null);
    }
  };

  const toggleDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("fa-IR").format(parseFloat(price));
  };

  /* ---------- render ---------- */

  return (
    <div
      dir="rtl"
      className={`${iranYekan.variable}`}
      style={{
        fontFamily: "var(--font-iran-yekan), system-ui, sans-serif",
        background: "var(--bg-base)",
        minHeight: "100vh",
        padding: "2rem 1rem",

        /* ---- design-system tokens ---- */
        "--bg-base": "#0A0A0F",
        "--bg-surface": "#12121A",
        "--bg-elevated": "#1A1A25",
        "--bg-overlay": "#22222E",
        "--bg-hover": "#16161F",
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
      } as React.CSSProperties}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ================= HEADER ================= */}
        <header style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--accent-text)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: 16,
              transition: "opacity .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            ← بازگشت به داشبورد
          </Link>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              marginBottom: 6,
            }}
          >
            مدیریت سفارش‌ها
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            مجموع {orders.length} سفارش
          </p>
        </header>

        {/* ================= EMPTY STATE ================= */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 20,
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <Package
              size={56}
              style={{ color: "var(--text-tertiary)", margin: "0 auto 16px" }}
              strokeWidth={1.4}
            />
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px",
              }}
            >
              هنوز سفارشی ندارید
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                margin: 0,
                maxWidth: 320,
                marginInline: "auto",
                lineHeight: 1.7,
              }}
            >
              وقتی مشتریان سفارش ثبت کنند، اینجا نمایش داده می‌شود
            </p>
          </motion.div>
        ) : (
          /* ================= ORDERS LIST ================= */
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {orders.map((order) => {
              const config = statusConfig[order.status];
              const isExpanded = expandedOrder === order.id;
              const isLoading = isUpdating === order.id;

              return (
                <motion.div
                  key={order.id}
                  variants={cardVariants}
                  layout
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "border-color .2s, background .2s",
                  }}
                  whileHover={{
                    borderColor: "rgba(255,255,255,0.10)",
                    background: "var(--bg-hover)",
                  }}
                >
                  {/* ---------- Card body ---------- */}
                  <div style={{ padding: "1.5rem" }}>
                    {/* Row 1: order number + status  |  total */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {order.orderNumber}
                        </span>

                        {/* Status badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            color: config.color,
                            background: config.bgColor,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: config.dotColor,
                              flexShrink: 0,
                            }}
                          />
                          {config.label}
                        </span>
                      </div>

                      {/* Total */}
                      <div style={{ textAlign: "left" }}>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            margin: 0,
                            marginBottom: 2,
                          }}
                        >
                          مبلغ کل
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            margin: 0,
                          }}
                        >
                          {formatPrice(order.totalAmount)}{" "}
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--text-secondary)",
                            }}
                          >
                            تومان
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Row 2: customer + date */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span style={{ fontSize: 15, opacity: 0.7 }}>👤</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {order.customerName}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span style={{ fontSize: 15, opacity: 0.7 }}>📅</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Row 3: order items summary */}
                    <div
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: "12px 16px",
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-tertiary)",
                          margin: "0 0 8px",
                        }}
                      >
                        آیتم‌های سفارش
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {order.orderItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13,
                            }}
                          >
                            <span style={{ color: "var(--text-primary)" }}>
                              {item.itemName}{" "}
                              <span style={{ color: "var(--text-tertiary)" }}>
                                (×{item.quantity})
                              </span>
                            </span>
                            <span
                              style={{
                                color: "var(--text-secondary)",
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {formatPrice(item.subtotal)} تومان
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 4: action buttons */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      {/* Details toggle */}
                      <button
                        onClick={() => toggleDetails(order.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 18px",
                          minHeight: 44,
                          borderRadius: 12,
                          border: "1px solid var(--border-default)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all .2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-overlay)";
                          e.currentTarget.style.borderColor = "var(--border-strong)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--bg-elevated)";
                          e.currentTarget.style.borderColor = "var(--border-default)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        {isExpanded ? "بستن جزئیات" : "مشاهده جزئیات"}
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ display: "flex" }}
                        >
                          <ChevronDown size={16} />
                        </motion.span>
                      </button>

                      {/* Status action buttons */}
                      {config.actions.map((action) => {
                        const actionStatusConfig = statusConfig[action];
                        const isCancelOrError = action === "cancelled" || action === "refunded";

                        return (
                          <button
                            key={action}
                            onClick={() => requestStatusUpdate(order.id, action)}
                            disabled={isLoading}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              padding: "10px 20px",
                              minHeight: 44,
                              borderRadius: 12,
                              border: "none",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: isLoading ? "not-allowed" : "pointer",
                              transition: "all .2s",
                              fontFamily: "inherit",
                              background: isLoading
                                ? "var(--bg-overlay)"
                                : isCancelOrError
                                  ? "var(--error-soft)"
                                  : actionStatusConfig.bgColor,
                              color: isLoading
                                ? "var(--text-tertiary)"
                                : isCancelOrError
                                  ? "var(--error)"
                                  : actionStatusConfig.color,
                              opacity: isLoading ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoading) e.currentTarget.style.opacity = "0.8";
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoading) e.currentTarget.style.opacity = "1";
                            }}
                          >
                            {isLoading ? "در حال بروزرسانی..." : actionLabels[action]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ---------- Expanded details ---------- */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="details"
                        variants={expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="exit"
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                            background: "var(--bg-elevated)",
                            padding: "1.5rem",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              margin: "0 0 16px",
                            }}
                          >
                            اطلاعات تماس و ارسال
                          </h4>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: 20,
                            }}
                          >
                            {/* Phone */}
                            <div>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-tertiary)",
                                  margin: "0 0 4px",
                                  fontWeight: 500,
                                }}
                              >
                                شماره تماس
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  color: "var(--text-primary)",
                                  fontWeight: 600,
                                  margin: 0,
                                  direction: "ltr",
                                  textAlign: "right",
                                }}
                              >
                                {order.customerPhone}
                              </p>
                            </div>

                            {/* Email */}
                            <div>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-tertiary)",
                                  margin: "0 0 4px",
                                  fontWeight: 500,
                                }}
                              >
                                ایمیل
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  color: "var(--text-primary)",
                                  fontWeight: 600,
                                  margin: 0,
                                  direction: "ltr",
                                  textAlign: "right",
                                }}
                              >
                                {order.customerEmail || "—"}
                              </p>
                            </div>

                            {/* Address */}
                            {order.shippingAddress && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text-tertiary)",
                                    margin: "0 0 4px",
                                    fontWeight: 500,
                                  }}
                                >
                                  آدرس ارسال
                                </p>
                                <p
                                  style={{
                                    fontSize: 14,
                                    color: "var(--text-primary)",
                                    margin: 0,
                                    lineHeight: 1.7,
                                  }}
                                >
                                  {order.shippingAddress}
                                </p>
                                {order.postalCode && (
                                  <p
                                    style={{
                                      fontSize: 13,
                                      color: "var(--text-secondary)",
                                      margin: "6px 0 0",
                                    }}
                                  >
                                    کد پستی: {order.postalCode}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Confirm Modal for status changes */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={ORDER_STATUS_META[confirmModal.newStatus]?.title || "تغییر وضعیت"}
        description={ORDER_STATUS_META[confirmModal.newStatus]?.description || "آیا مطمئن هستید؟"}
        confirmLabel={ORDER_STATUS_META[confirmModal.newStatus]?.label || "تأیید"}
        variant={ORDER_STATUS_META[confirmModal.newStatus]?.variant || "accent"}
        isLoading={!!isUpdating}
        onConfirm={executeStatusUpdate}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
