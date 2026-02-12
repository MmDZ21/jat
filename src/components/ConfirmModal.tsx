"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "accent" | "success";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    icon: "var(--error-soft)",
    iconColor: "var(--error)",
    btn: "var(--error)",
    btnHover: "var(--error)",
  },
  warning: {
    icon: "var(--warning-soft)",
    iconColor: "var(--warning)",
    btn: "var(--warning)",
    btnHover: "var(--warning)",
  },
  accent: {
    icon: "var(--accent-soft)",
    iconColor: "var(--accent)",
    btn: "var(--accent)",
    btnHover: "var(--accent)",
  },
  success: {
    icon: "var(--success-soft)",
    iconColor: "var(--success)",
    btn: "var(--success)",
    btnHover: "var(--success)",
  },
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "انصراف",
  variant = "accent",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const v = variantStyles[variant];

  // Portal target — mount to document.body to avoid CSS stacking issues
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => { if (!isLoading) onCancel(); }}
          />

          {/* Modal */}
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm z-100 rounded-2xl p-6"
            dir="rtl"
            style={{
              backgroundColor: "#12121A",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: v.icon }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: v.iconColor }} />
            </div>

            {/* Title */}
            <h3
              className="text-base font-bold text-center mb-2"
              style={{ color: "#EDEDF0" }}
            >
              {title}
            </h3>

            {/* Description */}
            <p
              className="text-sm text-center mb-6 leading-relaxed"
              style={{ color: "#8B8B9E" }}
            >
              {description}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "#1A1A25",
                  color: "#8B8B9E",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  backgroundColor: v.btn,
                  color: "#fff",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    لطفاً صبر کنید...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render via portal to document.body — avoids CSS transform/overflow issues from ancestors
  if (portalTarget) {
    return createPortal(modalContent, portalTarget);
  }
  return modalContent;
}
