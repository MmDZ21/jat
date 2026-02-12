"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { iranYekan } from "@/app/fonts";
import { sendPhoneOtp, verifyPhoneOtp } from "@/app/actions/phone-auth";
import {
  Phone,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  RefreshCw,
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
} as React.CSSProperties;

const RESEND_COOLDOWN = 60; // seconds

// ─── Component ────────────────────────────────────────────────────────────

export default function TrackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resend timer
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Start resend countdown ──

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Format phone display ──

  const formatPhoneDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (raw.length <= 11) {
      setPhone(raw);
    }
  };

  // ── Send OTP ──

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await sendPhoneOtp(phone.trim());

      if (!result.success) {
        setError(result.error || "خطایی رخ داد");
        return;
      }

      setStep("otp");
      startResendTimer();
      toast.success("کد تأیید ارسال شد");
      // Focus first OTP input after a small delay
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;

    setLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const result = await sendPhoneOtp(phone.trim());

      if (!result.success) {
        setError(result.error || "خطایی رخ داد");
        return;
      }

      startResendTimer();
      toast.success("کد جدید ارسال شد");
      otpRefs.current[0]?.focus();
    } catch {
      setError("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ──

  const handleVerifyOtp = useCallback(async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const result = await verifyPhoneOtp(phone.trim(), code);

      if (!result.success) {
        setError(result.error || "کد وارد شده نامعتبر است");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }

      toast.success("ورود موفق!");
      router.push("/my-orders");
    } catch {
      setError("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router]);

  // ── OTP input handlers ──

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp.join("")), 200);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => d === "");
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(pasted), 200);
    }
  };

  // ── Render ──

  return (
    <div
      dir="rtl"
      className={`${iranYekan.variable} min-h-screen flex items-center justify-center p-4`}
      style={{
        fontFamily: "var(--font-iran-yekan), system-ui, sans-serif",
        background: "var(--bg-base)",
        ...TOKENS,
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute top-[-20%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px]"
          style={{ background: "rgba(139,92,246,0.06)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--accent-soft)" }}
          >
            {step === "phone" ? (
              <Phone className="w-7 h-7" style={{ color: "var(--accent-text)" }} />
            ) : (
              <KeyRound className="w-7 h-7" style={{ color: "var(--accent-text)" }} />
            )}
          </div>

          {/* Title */}
          <h1
            className="text-xl font-bold text-center mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {step === "phone" ? "ورود / پیگیری سفارش" : "کد تأیید"}
          </h1>
          <p
            className="text-sm text-center mb-6 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {step === "phone"
              ? "شماره موبایل خود را وارد کنید"
              : `کد ۶ رقمی ارسال شده به ${formatPhoneDisplay(phone)} را وارد کنید`}
          </p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl px-4 py-3 text-xs"
                style={{ background: "var(--error-soft)", color: "var(--error)" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.form
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSendOtp}
              >
                {/* Phone input */}
                <div className="mb-5">
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    شماره موبایل
                  </label>
                  <div className="relative" dir="ltr" style={{ direction: "ltr" }}>
                    <input
                      type="tel"
                      dir="ltr"
                      value={formatPhoneDisplay(phone)}
                      onChange={handlePhoneChange}
                      placeholder="0912 345 6789"
                      required
                      autoFocus
                      inputMode="numeric"
                      className="w-full h-12 px-4 pl-16 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                        fontFamily: "inherit",
                        textAlign: "left",
                        direction: "ltr",
                        letterSpacing: "0.05em",
                      }}
                    />
                    {/* Iran flag + +98 badge */}
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none"
                    >
                      <span className="text-sm">🇮🇷</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        +۹۸
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, "").length < 10}
                  className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      دریافت کد تأیید
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* OTP inputs */}
                <div
                  className="flex gap-2 mb-5 justify-center"
                  dir="ltr"
                  style={{ direction: "ltr" }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      dir="ltr"
                      className="w-11 h-13 rounded-xl text-center text-lg font-bold outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30"
                      style={{
                        background: "var(--bg-input)",
                        border: `1px solid ${digit ? "var(--accent)" : "var(--border-default)"}`,
                        color: "var(--text-primary)",
                        fontFamily: "inherit",
                        direction: "ltr",
                        textAlign: "center",
                      }}
                    />
                  ))}
                </div>

                {/* Verify */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال بررسی...
                    </>
                  ) : (
                    "تأیید و ورود"
                  )}
                </button>

                {/* Resend timer */}
                <div className="mt-4 text-center">
                  {resendTimer > 0 ? (
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      ارسال مجدد کد تا{" "}
                      <span
                        className="font-bold tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {resendTimer}
                      </span>{" "}
                      ثانیه دیگر
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs font-medium flex items-center gap-1.5 mx-auto transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ color: "var(--accent-text)" }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      ارسال مجدد کد
                    </button>
                  )}
                </div>

                {/* Back */}
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                    if (timerRef.current) clearInterval(timerRef.current);
                    setResendTimer(0);
                  }}
                  className="w-full mt-3 h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  تغییر شماره موبایل
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p
          className="text-xs text-center mt-6"
          style={{ color: "var(--text-tertiary)" }}
        >
          ورود سریع با شماره موبایل — بدون نیاز به رمز عبور
        </p>
      </motion.div>
    </div>
  );
}
