"use server";

import { db } from "@/db";
import {
  serviceAvailability,
  bookings,
  items,
  profiles,
  orders,
  orderItems,
} from "@/db/schema";
import { eq, and, not, inArray, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";
import crypto from "crypto";
import {
  tehranTimeToUTC,
  getTehranDateStr,
  getTehranDayOfWeek,
  jsDayToPersianDay,
  generateTimeSlots,
  addMinutes,
} from "@/lib/time-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface AvailabilitySlotInput {
  dayOfWeek: number; // 0=Saturday..6=Friday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  slotDuration: number; // minutes
  isBreak: boolean;
  isActive: boolean;
}

export interface AvailableSlot {
  startTime: string; // ISO UTC string
  endTime: string;   // ISO UTC string
  displayStart: string; // "HH:mm" in Tehran time
  displayEnd: string;   // "HH:mm" in Tehran time
}

export interface CreateBookingInput {
  serviceId: string;
  startTime: string; // ISO UTC string
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNote?: string;
}

// ============================================================================
// SAVE AVAILABILITY (Seller)
// ============================================================================

export async function saveAvailability(
  slots: AvailabilitySlotInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    // Validate slots
    for (const slot of slots) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        return { success: false, error: "روز هفته نامعتبر است" };
      }
      if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
        return { success: false, error: "فرمت ساعت نامعتبر است" };
      }
      if (slot.startTime >= slot.endTime) {
        return { success: false, error: "ساعت شروع باید قبل از ساعت پایان باشد" };
      }
      if (slot.slotDuration < 5 || slot.slotDuration > 480) {
        return { success: false, error: "مدت زمان هر نوبت باید بین ۵ تا ۴۸۰ دقیقه باشد" };
      }
    }

    // Replace all existing availability
    await db.transaction(async (tx) => {
      await tx
        .delete(serviceAvailability)
        .where(eq(serviceAvailability.profileId, profile.id));

      if (slots.length > 0) {
        await tx.insert(serviceAvailability).values(
          slots.map((slot) => ({
            profileId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration,
            isBreak: slot.isBreak,
            isActive: slot.isActive,
          }))
        );
      }
    });

    revalidatePath("/dashboard/availability");
    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error saving availability:", error);
    return { success: false, error: "خطایی در ذخیره ساعات کاری رخ داد" };
  }
}

// ============================================================================
// GET SELLER AVAILABILITY
// ============================================================================

export async function getSellerAvailability(): Promise<{
  success: boolean;
  data?: AvailabilitySlotInput[];
  error?: string;
}> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const rows = await db.query.serviceAvailability.findMany({
      where: eq(serviceAvailability.profileId, profile.id),
      orderBy: [serviceAvailability.dayOfWeek, serviceAvailability.startTime],
    });

    return {
      success: true,
      data: rows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        slotDuration: r.slotDuration,
        isBreak: r.isBreak,
        isActive: r.isActive,
      })),
    };
  } catch (error) {
    console.error("Error fetching availability:", error);
    return { success: false, error: "خطایی رخ داد" };
  }
}

// ============================================================================
// GET AVAILABLE SLOTS (Public)
// ============================================================================

export async function getAvailableSlots(
  serviceId: string,
  dateStr: string // "YYYY-MM-DD"
): Promise<{ success: boolean; slots?: AvailableSlot[]; error?: string }> {
  try {
    // Load the service
    const service = await db.query.items.findFirst({
      where: and(eq(items.id, serviceId), eq(items.type, "service"), eq(items.isActive, true)),
    });
    if (!service) {
      return { success: false, error: "خدمت یافت نشد" };
    }

    const duration = service.durationMinutes || 30;

    // Load seller profile
    const seller = await db.query.profiles.findFirst({
      where: eq(profiles.id, service.sellerId),
    });
    if (!seller || seller.vacationMode) {
      return { success: false, error: "فروشگاه در حال حاضر فعال نیست" };
    }

    const leadTimeHours = seller.leadTimeHours || 0;

    // Figure out the day of week for the target date
    const targetDateUTC = new Date(`${dateStr}T12:00:00Z`); // noon UTC as reference
    const jsDow = getTehranDayOfWeek(targetDateUTC);
    const persianDow = jsDayToPersianDay(jsDow);

    // Load availability for this day
    const dayAvailability = await db.query.serviceAvailability.findMany({
      where: and(
        eq(serviceAvailability.profileId, service.sellerId),
        eq(serviceAvailability.dayOfWeek, persianDow),
        eq(serviceAvailability.isActive, true)
      ),
      orderBy: [serviceAvailability.startTime],
    });

    if (dayAvailability.length === 0) {
      return { success: true, slots: [] }; // Seller is off this day
    }

    // Separate working windows and breaks
    const workWindows = dayAvailability.filter((a) => !a.isBreak);
    const breakWindows = dayAvailability.filter((a) => a.isBreak);

    // Generate all possible slot start times
    const allSlotStarts: { time: string; slotDuration: number }[] = [];
    for (const win of workWindows) {
      const starts = generateTimeSlots(win.startTime, win.endTime, duration);
      for (const s of starts) {
        allSlotStarts.push({ time: s, slotDuration: win.slotDuration });
      }
    }

    // Filter out slots that overlap with breaks
    const filteredSlots = allSlotStarts.filter((slot) => {
      const [sh, sm] = slot.time.split(":").map(Number);
      const slotStartMin = sh * 60 + sm;
      const slotEndMin = slotStartMin + duration;

      for (const brk of breakWindows) {
        const [bsh, bsm] = brk.startTime.split(":").map(Number);
        const [beh, bem] = brk.endTime.split(":").map(Number);
        const breakStart = bsh * 60 + bsm;
        const breakEnd = beh * 60 + bem;

        // Overlap check
        if (slotStartMin < breakEnd && slotEndMin > breakStart) {
          return false;
        }
      }
      return true;
    });

    // Convert to UTC and filter against existing bookings
    const dayStart = tehranTimeToUTC(dateStr, "00:00");
    const dayEnd = tehranTimeToUTC(dateStr, "23:59");

    // Load existing bookings for this seller on this day
    const existingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.sellerId, service.sellerId),
        gte(bookings.startTime, dayStart),
        lte(bookings.startTime, dayEnd),
        not(eq(bookings.status, "cancelled"))
      ),
    });

    const now = new Date();
    const minBookingTime = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);

    const availableSlots: AvailableSlot[] = [];

    for (const slot of filteredSlots) {
      const slotStartUTC = tehranTimeToUTC(dateStr, slot.time);
      const slotEndUTC = addMinutes(slotStartUTC, duration);

      // Check lead time
      if (slotStartUTC <= minBookingTime) continue;

      // Check conflicts with existing bookings
      const hasConflict = existingBookings.some((booking) => {
        const bStart = new Date(booking.startTime);
        const bEnd = new Date(booking.endTime);
        return slotStartUTC < bEnd && slotEndUTC > bStart;
      });

      if (!hasConflict) {
        // Display time in Tehran
        const displayStart = slot.time;
        const endH = Math.floor((parseInt(slot.time.split(":")[0]) * 60 + parseInt(slot.time.split(":")[1]) + duration) / 60);
        const endM = (parseInt(slot.time.split(":")[0]) * 60 + parseInt(slot.time.split(":")[1]) + duration) % 60;
        const displayEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

        availableSlots.push({
          startTime: slotStartUTC.toISOString(),
          endTime: slotEndUTC.toISOString(),
          displayStart,
          displayEnd,
        });
      }
    }

    return { success: true, slots: availableSlots };
  } catch (error) {
    console.error("Error getting available slots:", error);
    return { success: false, error: "خطایی در دریافت زمان‌های موجود رخ داد" };
  }
}

// ============================================================================
// GET AVAILABILITY FOR PROFILE (Public - for calendar day availability check)
// ============================================================================

export async function getProfileAvailability(
  profileId: string
): Promise<{ success: boolean; data?: AvailabilitySlotInput[]; error?: string }> {
  try {
    const rows = await db.query.serviceAvailability.findMany({
      where: and(
        eq(serviceAvailability.profileId, profileId),
        eq(serviceAvailability.isActive, true)
      ),
    });

    return {
      success: true,
      data: rows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        slotDuration: r.slotDuration,
        isBreak: r.isBreak,
        isActive: r.isActive,
      })),
    };
  } catch (error) {
    console.error("Error fetching profile availability:", error);
    return { success: false, error: "خطایی رخ داد" };
  }
}

// ============================================================================
// CREATE BOOKING (Public - Guest)
// ============================================================================

function generateOrderSuffix(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function createBooking(
  data: CreateBookingInput
): Promise<{ success: boolean; bookingId?: string; orderId?: string; error?: string }> {
  try {
    // Validation
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: "نام باید حداقل ۲ کاراکتر باشد" };
    }
    if (!data.customerPhone || data.customerPhone.trim().length < 10) {
      return { success: false, error: "شماره تماس معتبر نیست" };
    }

    // Load service
    const service = await db.query.items.findFirst({
      where: and(eq(items.id, data.serviceId), eq(items.type, "service"), eq(items.isActive, true)),
    });
    if (!service) {
      return { success: false, error: "خدمت یافت نشد" };
    }

    const duration = service.durationMinutes || 30;
    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, duration);

    // Load seller
    const seller = await db.query.profiles.findFirst({
      where: eq(profiles.id, service.sellerId),
    });
    if (!seller) {
      return { success: false, error: "فروشنده یافت نشد" };
    }
    if (seller.vacationMode) {
      return { success: false, error: "فروشگاه موقتاً بسته است" };
    }

    const feePercentage = parseFloat(seller.platformFeePercentage || "10.00");
    const price = parseFloat(service.price);
    const platformFee = (price * feePercentage) / 100;
    const sellerAmount = price - platformFee;

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const orderNumber = `JAT-${datePart}-${generateOrderSuffix()}`;

    // Use transaction for double-booking prevention
    const result = await db.transaction(async (tx) => {
      // Row-level lock: check for conflicting bookings
      const conflicts = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.sellerId, service.sellerId),
            not(eq(bookings.status, "cancelled")),
            sql`${bookings.startTime} < ${endTime.toISOString()}::timestamptz`,
            sql`${bookings.endTime} > ${startTime.toISOString()}::timestamptz`
          )
        )
        .for("update");

      if (conflicts.length > 0) {
        throw new Error("SLOT_TAKEN");
      }

      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          sellerId: service.sellerId,
          customerId: null,
          customerName: data.customerName.trim(),
          customerEmail: data.customerEmail?.trim() || "",
          customerPhone: data.customerPhone.trim(),
          shippingAddress: null,
          status: "approved",
          paymentStatus: "pending",
          subtotal: price.toFixed(2),
          platformFee: platformFee.toFixed(2),
          sellerAmount: sellerAmount.toFixed(2),
          totalAmount: price.toFixed(2),
          currency: "IRT",
          customerNote: data.customerNote?.trim() || null,
        })
        .returning({ id: orders.id });

      // Create order item
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        itemId: service.id,
        itemName: service.name,
        itemType: "service",
        unitPrice: service.price,
        quantity: 1,
        subtotal: service.price,
        appointmentSlot: startTime,
        durationMinutes: duration,
      });

      // Create booking
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          sellerId: service.sellerId,
          serviceId: service.id,
          orderId: newOrder.id,
          customerName: data.customerName.trim(),
          customerPhone: data.customerPhone.trim(),
          customerEmail: data.customerEmail?.trim() || null,
          customerNote: data.customerNote?.trim() || null,
          startTime,
          endTime,
          status: "pending",
        })
        .returning({ id: bookings.id });

      return { bookingId: newBooking.id, orderId: newOrder.id };
    });

    const slug = seller.shopSlug || seller.username;
    if (slug) revalidatePath(`/shop/${slug}`);
    revalidatePath("/dashboard/appointments");

    return { success: true, bookingId: result.bookingId, orderId: result.orderId };
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return { success: false, error: "این زمان قبلاً رزرو شده است. لطفاً زمان دیگری انتخاب کنید." };
    }
    console.error("Error creating booking:", error);
    return { success: false, error: "خطایی در ثبت رزرو رخ داد" };
  }
}

// ============================================================================
// GET SELLER BOOKINGS (Auth-protected)
// ============================================================================

export async function getSellerBookings(filters?: {
  status?: string;
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
}): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    serviceName: string;
    serviceId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    customerNote: string | null;
    startTime: string;
    endTime: string;
    status: string;
    orderId: string | null;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const conditions = [eq(bookings.sellerId, profile.id)];

    if (filters?.status && filters.status !== "all") {
      conditions.push(
        eq(bookings.status, filters.status as "pending" | "confirmed" | "completed" | "cancelled" | "no_show")
      );
    }

    if (filters?.dateFrom) {
      conditions.push(gte(bookings.startTime, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(bookings.startTime, new Date(filters.dateTo)));
    }

    const rows = await db
      .select({
        id: bookings.id,
        serviceId: bookings.serviceId,
        serviceName: items.name,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        customerNote: bookings.customerNote,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        orderId: bookings.orderId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(items, eq(bookings.serviceId, items.id))
      .where(and(...conditions))
      .orderBy(bookings.startTime);

    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        serviceId: r.serviceId,
        serviceName: r.serviceName || "خدمت حذف‌شده",
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        customerNote: r.customerNote,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status,
        orderId: r.orderId,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching seller bookings:", error);
    return { success: false, error: "خطایی رخ داد" };
  }
}

// ============================================================================
// UPDATE BOOKING STATUS (Auth-protected)
// ============================================================================

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function updateBookingStatus(
  bookingId: string,
  newStatus: "confirmed" | "completed" | "cancelled" | "no_show",
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const booking = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.sellerId, profile.id)),
    });

    if (!booking) {
      return { success: false, error: "رزرو یافت نشد" };
    }

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `تغییر وضعیت از "${booking.status}" به "${newStatus}" مجاز نیست` };
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === "confirmed") updateData.confirmedAt = now;
    if (newStatus === "completed") updateData.completedAt = now;
    if (newStatus === "cancelled") {
      updateData.cancelledAt = now;
      if (reason) updateData.cancellationReason = reason;
    }

    await db.transaction(async (tx) => {
      await tx.update(bookings).set(updateData).where(eq(bookings.id, bookingId));

      // Sync order status if linked
      if (booking.orderId) {
        if (newStatus === "confirmed") {
          await tx.update(orders).set({ status: "processing", updatedAt: now }).where(eq(orders.id, booking.orderId));
        } else if (newStatus === "completed") {
          await tx.update(orders).set({ status: "completed", completedAt: now, updatedAt: now }).where(eq(orders.id, booking.orderId));
        } else if (newStatus === "cancelled") {
          await tx.update(orders).set({ status: "cancelled", cancelledAt: now, cancellationReason: reason || null, updatedAt: now }).where(eq(orders.id, booking.orderId));
        }
      }
    });

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { success: false, error: "خطایی رخ داد" };
  }
}
