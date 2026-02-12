"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ExternalLink, Sparkles, X } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface ImportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedCount: number;
  shopSlug: string;
}

export default function ImportSuccessModal({
  isOpen,
  onClose,
  importedCount,
  shopSlug,
}: ImportSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const shopUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${shopSlug}`;

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981"],
      });

      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ec4899", "#8b5cf6"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#3b82f6", "#10b981"],
        });
      }, 250);

      // Stars
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 360,
          ticks: 100,
          gravity: 0.5,
          decay: 0.94,
          startVelocity: 30,
          shapes: ["star"],
          colors: ["#FFD700", "#FFA500", "#FF69B4"],
        });
      }, 500);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              '--bg-surface': '#111114',
              '--bg-elevated': '#18181C',
              '--bg-overlay': '#1F1F25',
              '--border-subtle': 'rgba(255,255,255,0.06)',
              '--border-default': 'rgba(255,255,255,0.08)',
              '--text-primary': '#EDEDF0',
              '--text-secondary': '#8B8B9E',
              '--text-tertiary': '#5C5C70',
              '--accent': '#8B5CF6',
              '--accent-hover': '#7C3AED',
              '--accent-text': '#A78BFA',
              '--success': '#34D399',
            } as React.CSSProperties}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="rounded-3xl max-w-md w-full overflow-hidden relative"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full transition-colors flex items-center justify-center z-10"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with gradient */}
              <div
                className="p-8 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover), #6D28D9)' }}
              >
                {/* Animated sparkles background */}
                <div className="absolute inset-0 opacity-20">
                  <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white animate-pulse" />
                  <Sparkles className="absolute bottom-8 left-8 w-4 h-4 text-white animate-pulse delay-150" />
                  <Sparkles className="absolute top-12 left-12 w-5 h-5 text-white animate-pulse delay-300" />
                </div>

                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-10 h-10" style={{ color: 'var(--success)' }} strokeWidth={3} />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  🎉 موفق بود!
                </motion.h2>

                {/* Count */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg"
                >
                  {importedCount} محصول با موفقیت اضافه شد
                </motion.p>
              </div>

              {/* Body */}
              <div className="p-8">
                {/* Shop Link Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                    لینک فروشگاه شما:
                  </p>
                  
                  {/* URL Display with Copy Button */}
                  <div
                    className="rounded-xl p-4 mb-4 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate dir-ltr text-right" style={{ color: 'var(--text-primary)' }}>
                        {shopUrl}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="shrink-0 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--bg-overlay)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                          <span style={{ color: 'var(--success)' }}>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>کپی</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-3"
                >
                  {/* View Shop Button */}
                  <Link
                    href={`/shop/${shopSlug}`}
                    className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(to right, var(--accent), var(--accent-hover))',
                      boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
                    }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    مشاهده فروشگاه
                  </Link>

                  {/* Back to Dashboard */}
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 font-medium rounded-xl transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    بازگشت به داشبورد
                  </button>
                </motion.div>

                {/* Success Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center text-sm mt-6"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  محصولات شما الان در فروشگاه قابل مشاهده هستند! 🚀
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
