"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, ShoppingBag, BarChart3, Palette } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  {
    icon: ShoppingBag,
    title: "فروشگاه آنلاین",
    desc: "صفحه فروشگاه اختصاصی با لینک شخصی، آماده اشتراک‌گذاری در بیو اینستاگرام.",
  },
  {
    icon: BarChart3,
    title: "مدیریت سفارش",
    desc: "پیگیری و مدیریت سفارش‌ها از لحظه ثبت تا تحویل، همه‌جا در دسترس.",
  },
  {
    icon: Palette,
    title: "برندسازی سفارشی",
    desc: "رنگ، تم و ظاهر فروشگاهتان را دقیقاً مطابق هویت برندتان تنظیم کنید.",
  },
];

export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-40%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-violet-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #EC4899 100%)",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.1)",
            }}
          >
            <span className="text-3xl font-black text-white">J</span>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>
            فروشگاهتان را در ۲ دقیقه بسازید
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-7xl font-black text-center mb-6 leading-[1.15] tracking-tight"
        >
          <span className="text-gradient">فروشگاه‌ساز</span>
          <br />
          <span style={{ color: "var(--text-primary)" }}>حرفه‌ای</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center max-w-md text-base md:text-lg mb-10 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          محصولات و خدماتتان را با یک لینک ساده بفروشید.
          <br />
          مدیریت سفارش، درگاه پرداخت و تم اختصاصی.
        </motion.p>

        {/* CTA */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)",
              boxShadow: "0 0 30px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            شروع کنید
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={4 + i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="group rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-soft)" }}
              >
                <f.icon className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
              </div>
              <h3
                className="font-bold text-base mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-20 text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          ساخته شده با{" "}
          <span className="text-gradient">♥</span>{" "}
          توسط JAT
        </motion.p>
      </div>
    </div>
  );
}
