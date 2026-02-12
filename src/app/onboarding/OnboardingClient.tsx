"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { iranYekan } from "@/app/fonts";
import { Store, Instagram, Loader2, Check, X, Sparkles, ArrowRight } from "lucide-react";
import { checkSlugAvailability, completeOnboarding } from "@/app/actions/onboarding";

export default function OnboardingClient() {
  const router = useRouter();
  
  const [shopName, setShopName] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInstagramUsername(value);

    if (value.trim()) {
      // Convert to valid slug format (lowercase, remove invalid chars)
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 50);
      setShopSlug(slug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setShopSlug(value);

    if (!value.trim()) {
      setSlugAvailable(null);
      setSlugMessage("");
      setIsCheckingSlug(false);
    }
  };

  // Check slug availability when it changes
  useEffect(() => {
    if (!shopSlug.trim()) {
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsCheckingSlug(true);
      setSlugAvailable(null);
      
      const result = await checkSlugAvailability(shopSlug);
      
      setSlugAvailable(result.available);
      setSlugMessage(result.message || (result.available ? "این آدرس در دسترس است!" : ""));
      setIsCheckingSlug(false);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [shopSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopName.trim()) {
      setError("نام فروشگاه الزامی است");
      return;
    }

    if (!shopSlug.trim()) {
      setError("آدرس فروشگاه الزامی است");
      return;
    }

    if (slugAvailable === false) {
      setError("لطفاً یک آدرس منحصر به فرد انتخاب کنید");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await completeOnboarding({
      shopName,
      shopSlug,
      instagramUsername: instagramUsername || undefined,
    });

    if (result.success) {
      // Redirect to dashboard/import page
      router.push("/dashboard/import");
    } else {
      setError(result.error || "خطا در ذخیره اطلاعات");
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || slugAvailable === false || !shopName.trim() || !shopSlug.trim();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${iranYekan.variable} font-sans`}
      style={{
        fontFamily: "var(--font-iran-yekan)",
        backgroundColor: '#09090B',
        '--bg-base': '#09090B',
        '--bg-surface': '#111114',
        '--bg-elevated': '#18181C',
        '--bg-overlay': '#1F1F25',
        '--bg-hover': '#26262E',
        '--bg-input': '#141418',
        '--border-subtle': 'rgba(255,255,255,0.06)',
        '--border-default': 'rgba(255,255,255,0.08)',
        '--border-strong': 'rgba(255,255,255,0.12)',
        '--text-primary': '#EDEDF0',
        '--text-secondary': '#8B8B9E',
        '--text-tertiary': '#5C5C70',
        '--accent': '#8B5CF6',
        '--accent-hover': '#7C3AED',
        '--accent-soft': 'rgba(139,92,246,0.12)',
        '--accent-glow': 'rgba(139,92,246,0.20)',
        '--accent-text': '#A78BFA',
        '--success': '#34D399',
        '--success-soft': 'rgba(52,211,153,0.12)',
        '--error': '#F87171',
        '--error-soft': 'rgba(248,113,113,0.12)',
        '--shadow-card': '0 2px 8px rgba(0,0,0,0.3)',
        '--shadow-lg': '0 8px 32px rgba(0,0,0,0.4)',
      } as React.CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))',
              boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            به JAT خوش آمدید! 🎉
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            بیایید فروشگاه آنلاین شما را راه‌اندازی کنیم
          </p>
        </div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="rounded-3xl p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Shop Name */}
          <div>
            <label
              htmlFor="shopName"
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Store className="w-4 h-4" />
              نام فروشگاه
            </label>
            <input
              type="text"
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="مثلاً: فروشگاه شیک"
              className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              این نام در صفحه فروشگاه شما نمایش داده می‌شود
            </p>
          </div>

          {/* Instagram Username */}
          <div>
            <label
              htmlFor="instagramUsername"
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Instagram className="w-4 h-4" />
              نام کاربری اینستاگرام (اختیاری)
            </label>
            <input
              type="text"
              id="instagramUsername"
              value={instagramUsername}
              onChange={handleInstagramChange}
              placeholder="username"
              className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              برای ایمپورت خودکار محصولات از اینستاگرام
            </p>
          </div>

          {/* Shop Slug */}
          <div>
            <label
              htmlFor="shopSlug"
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowRight className="w-4 h-4" />
              آدرس فروشگاه شما
            </label>
            <div className="relative">
              <input
                type="text"
                id="shopSlug"
                value={shopSlug}
                onChange={handleSlugChange}
                placeholder="shop_name"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all pr-12 focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  textAlign: "right",
                }}
                required
                disabled={isSubmitting}
                dir="ltr"
              />
              
              {/* Status Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                {isCheckingSlug && (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />
                )}
                {!isCheckingSlug && slugAvailable === false && (
                  <X className="w-5 h-5" style={{ color: 'var(--error)' }} />
                )}
              </div>
            </div>
            
            {/* URL Preview */}
            <div
              className="mt-2 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>لینک فروشگاه شما:</p>
              <p
                className="text-sm font-medium dir-ltr text-right break-all"
                style={{ color: 'var(--accent-text)' }}
                suppressHydrationWarning
              >
                {typeof window !== "undefined" ? window.location.origin : "jat.ir"}/shop/{shopSlug || "..."}
              </p>
            </div>

            {/* Slug Message */}
            {slugMessage && (
              <p
                className="text-xs mt-2"
                style={{ color: slugAvailable ? 'var(--success)' : 'var(--error)' }}
              >
                {slugMessage}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--error-soft)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full px-6 py-4 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            style={{
              background: isDisabled
                ? 'linear-gradient(to right, #5C5C70, #5C5C70)'
                : 'linear-gradient(to right, var(--accent), var(--accent-hover))',
              boxShadow: isDisabled ? 'none' : '0 8px 32px rgba(139,92,246,0.3)',
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                شروع کنیم! 🚀
              </>
            )}
          </button>

          {/* Info Text */}
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            بعد از راه‌اندازی، می‌توانید محصولات خود را از اینستاگرام ایمپورت کنید
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
