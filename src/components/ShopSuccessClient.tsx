"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Copy, Check, CalendarDays } from "lucide-react";
import { useCart } from "@/store/useCart";

interface ShopSuccessClientProps {
  shopSlug?: string;
  orderNumber?: string;
  customerPhone?: string;
}

export default function ShopSuccessClient({ shopSlug, orderNumber, customerPhone }: ShopSuccessClientProps) {
  const clearCart = useCart((state) => state.clearCart);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="relative z-10 max-w-md w-full rounded-2xl p-8 text-center"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: "var(--success-soft)",
            boxShadow: "0 0 30px rgba(52, 211, 153, 0.15)",
          }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: "var(--success)" }} />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          پرداخت با موفقیت انجام شد
        </h1>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          سفارش شما ثبت شد و به زودی توسط فروشنده پردازش می‌شود.
        </p>

        {orderNumber && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>شماره سفارش</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-bold font-mono tracking-wide" style={{ color: "var(--text-primary)" }}>
                {orderNumber}
              </p>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="p-2 rounded-lg transition-colors"
                title="کپی شماره سفارش"
                style={{ color: "var(--text-secondary)" }}
              >
                {copied ? (
                  <Check className="w-4 h-4" style={{ color: "var(--success)" }} />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs mt-1" style={{ color: "var(--success)" }}>کپی شد!</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {customerPhone && (
            <Link
              href={`/track?phone=${encodeURIComponent(customerPhone)}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--accent-soft, rgba(139,92,246,0.12))",
                color: "var(--accent-text, #A78BFA)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <CalendarDays className="w-5 h-5" />
              مشاهده نوبت‌های من
            </Link>
          )}
          <Link
            href={shopSlug ? `/shop/${shopSlug}` : "/"}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
              boxShadow: "0 0 20px rgba(52, 211, 153, 0.2)",
            }}
          >
            {shopSlug ? "بازگشت به فروشگاه" : "بازگشت به صفحه اصلی"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
