"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import { iranYekan } from "@/app/fonts";
import { getSalesAnalytics, type DayData } from "@/app/actions/analytics";

const priceFormatter = new Intl.NumberFormat("fa-IR", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const chartFontFamily = "var(--font-iran-yekan), 'Iran-Yekan', sans-serif";

function formatTooltipValue(value: number): string {
  return priceFormatter.format(Math.round(value));
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return priceFormatter.format(value);
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export default function SalesAnalytics() {
  const [data, setData] = useState<{
    dailyData: DayData[];
    totalRevenue: number;
    orderCount: number;
    aov: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getSalesAnalytics().then((res) => {
      if (!mounted) return;
      setLoading(false);
      if (res.success) {
        setData({
          dailyData: res.dailyData,
          totalRevenue: res.totalRevenue,
          orderCount: res.orderCount,
          aov: res.aov,
        });
        setError(null);
      } else {
        setError(res.error ?? "خطا در بارگذاری");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section
        dir="rtl"
        className={`mb-8 rounded-2xl p-6 ${iranYekan.variable}`}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-center min-h-[280px] gap-2" style={{ color: "var(--text-secondary)" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>در حال بارگذاری آمار فروش...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        dir="rtl"
        className={`mb-8 rounded-2xl p-6 ${iranYekan.variable}`}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p style={{ color: "var(--error)" }}>{error}</p>
      </section>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "کل درآمد",
      value: priceFormatter.format(Math.round(data.totalRevenue)),
      suffix: "تومان",
      icon: DollarSign,
      color: "var(--accent)",
    },
    {
      label: "تعداد سفارش",
      value: priceFormatter.format(data.orderCount),
      suffix: "سفارش",
      icon: ShoppingBag,
      color: "var(--text-secondary)",
    },
    {
      label: "میانگین سفارش",
      value: priceFormatter.format(Math.round(data.aov)),
      suffix: "تومان",
      icon: TrendingUp,
      color: "var(--success)",
    },
  ];

  const chartData = data.dailyData.map((d) => ({
    ...d,
    displayDate: formatChartDate(d.date),
  }));

  const isEmpty = data.orderCount === 0 && data.totalRevenue === 0;

  return (
    <section
      dir="rtl"
      className={`mb-8 ${iranYekan.variable}`}
      style={{ fontFamily: chartFontFamily }}
    >
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        آمار فروش (۳۰ روز اخیر)
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 transition-colors"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: "var(--bg-elevated)", color: s.color }}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {s.label}
                </p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {s.value} {s.suffix}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {isEmpty ? (
          <div
            className="flex flex-col items-center justify-center min-h-[280px] py-8"
            style={{ color: "var(--text-tertiary)" }}
          >
            <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
              هنوز فروشی ثبت نشده است
            </p>
            <p className="text-sm mt-1">در ۳۰ روز گذشته سفارشی یافت نشد</p>
          </div>
        ) : (
          <div className="w-full h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: chartFontFamily }}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatAxisValue}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: chartFontFamily }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    fontFamily: chartFontFamily,
                  }}
                  labelStyle={{ color: "var(--text-primary)" }}
                  formatter={(value: number | undefined) => [formatTooltipValue(value ?? 0), "درآمد"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
