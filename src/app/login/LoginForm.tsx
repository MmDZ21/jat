"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { login, signup, resetPassword, checkAuth } from "@/app/actions/auth";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (authenticated) router.replace("/dashboard");
      else setCheckingAuth(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (mode === "forgot") {
        const email = formData.get("email") as string;
        const result = await resetPassword(email);
        if (result.success) {
          toast.success("لینک بازیابی رمز عبور به ایمیلتان ارسال شد.");
          setMode("login");
        } else {
          setError(result.error || "خطایی رخ داد");
        }
      } else {
        const result = mode === "login" ? await login(formData) : await signup(formData);
        if (result?.error) setError(result.error);
      }
    } catch {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 text-sm" +
    " placeholder:text-[var(--text-tertiary)]" +
    " focus:ring-2 focus:ring-[var(--accent)]/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-8"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--accent), #EC4899)",
            boxShadow: "0 0 24px var(--accent-glow)",
          }}
        >
          <span className="text-lg font-black text-white">J</span>
        </div>
      </div>

      {/* Header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {mode === "login" ? "خوش آمدید" : mode === "signup" ? "ایجاد حساب" : "بازیابی رمز عبور"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {mode === "login"
              ? "به پنل فروشندگان JAT وارد شوید"
              : mode === "signup"
              ? "حساب فروشنده جدید بسازید"
              : "لینک بازیابی به ایمیلتان ارسال می‌شود"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-xl text-sm"
            style={{
              background: "var(--error-soft)",
              color: "var(--error)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Signup fields */}
        <AnimatePresence>
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  نام کاربری
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  pattern="[a-zA-Z0-9_\-]+"
                  className={inputClass}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  نام نمایشی
                </label>
                <input
                  type="text"
                  name="displayName"
                  required
                  className={inputClass}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  placeholder="نام و نام خانوادگی"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            ایمیل
          </label>
          <input
            type="email"
            name="email"
            required
            className={inputClass}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            placeholder="you@example.com"
          />
        </div>

        {mode !== "forgot" && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              رمز عبور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                className={inputClass + " pl-12"}
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                placeholder="حداقل ۶ کاراکتر"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {mode === "login" && (
          <div className="text-left">
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(null); }}
              className="text-xs transition-colors"
              style={{ color: "var(--accent-text)" }}
            >
              رمز عبور را فراموش کرده‌اید؟
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)",
            boxShadow: "0 0 20px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "login" ? (
            "ورود"
          ) : mode === "signup" ? (
            "ثبت‌نام"
          ) : (
            <>
              <Mail className="w-4 h-4" />
              ارسال لینک بازیابی
            </>
          )}
        </button>
      </form>

      {/* Mode switchers */}
      <div className="mt-6 text-center space-y-2">
        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className="text-sm font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
            style={{ color: "var(--accent-text)" }}
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به ورود
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            className="text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            {mode === "login" ? (
              <>حساب ندارید؟ <span style={{ color: "var(--accent-text)" }}>ثبت‌نام کنید</span></>
            ) : (
              <>حساب دارید؟ <span style={{ color: "var(--accent-text)" }}>وارد شوید</span></>
            )}
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </motion.div>
  );
}
