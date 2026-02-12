"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, gte, lte, notInArray } from "drizzle-orm";
import { getCurrentUserProfile } from "./auth";

export interface DayData {
  date: string; // YYYY-MM-DD
  revenue: number;
  orderCount: number;
}

export interface SalesAnalyticsResult {
  success: boolean;
  dailyData: DayData[];
  totalRevenue: number;
  orderCount: number;
  aov: number; // Average Order Value
  error?: string;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch sales analytics for the last 30 days for the current seller.
 * Fills gap days with revenue=0, orderCount=0 so the chart remains continuous.
 */
export async function getSalesAnalytics(): Promise<SalesAnalyticsResult> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, dailyData: [], totalRevenue: 0, orderCount: 0, aov: 0, error: "کاربر احراز هویت نشده است" };
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const rawOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.sellerId, profile.id),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, now),
        notInArray(orders.status, ["cancelled", "refunded"])
      ),
      columns: { createdAt: true, totalAmount: true },
    });

    // Build map: dateKey -> { revenue, orderCount }
    const map = new Map<string, { revenue: number; orderCount: number }>();
    let totalRevenue = 0;
    let orderCount = 0;

    for (const o of rawOrders) {
      const key = toDateKey(o.createdAt);
      const amount = parseFloat(o.totalAmount ?? "0");
      totalRevenue += amount;
      orderCount += 1;

      const existing = map.get(key);
      if (existing) {
        existing.revenue += amount;
        existing.orderCount += 1;
      } else {
        map.set(key, { revenue: amount, orderCount: 1 });
      }
    }

    // Fill gap days for last 30 days
    const dailyData: DayData[] = [];
    const day = new Date(startDate);
    while (day <= now) {
      const key = toDateKey(day);
      const entry = map.get(key);
      dailyData.push({
        date: key,
        revenue: entry?.revenue ?? 0,
        orderCount: entry?.orderCount ?? 0,
      });
      day.setDate(day.getDate() + 1);
    }

    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      success: true,
      dailyData,
      totalRevenue,
      orderCount,
      aov,
    };
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    return {
      success: false,
      dailyData: [],
      totalRevenue: 0,
      orderCount: 0,
      aov: 0,
      error: "خطا در بارگذاری آمار فروش",
    };
  }
}
