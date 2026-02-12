"use server";

import { db } from "@/db";
import { bookings, orders, items, profiles, orderItems } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCustomerPhone } from "@/lib/phone-auth";

// ============================================================================
// HELPERS
// ============================================================================

async function getAuthenticatedPhone(): Promise<string | null> {
  return await getCustomerPhone();
}

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerBooking {
  id: string;
  serviceName: string;
  serviceId: string;
  sellerName: string;
  shopSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  startTime: string;
  endTime: string;
  status: string;
  orderId: string | null;
  cancellationWindowHours: number;
  createdAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  sellerName: string;
  shopSlug: string;
  customerName: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: {
    id: string;
    itemName: string;
    itemType: string;
    unitPrice: string;
    quantity: number;
    subtotal: string;
  }[];
}

// ============================================================================
// GET CUSTOMER BOOKINGS & ORDERS
// ============================================================================

export async function getCustomerBookingsAndOrders(): Promise<{
  success: boolean;
  bookings?: CustomerBooking[];
  orders?: CustomerOrder[];
  error?: string;
}> {
  try {
    const phone = await getAuthenticatedPhone();
    if (!phone) {
      return { success: false, error: "لطفاً ابتدا وارد شوید" };
    }

    // Fetch bookings with service and seller info — lookup by customerPhone
    const customerBookings = await db
      .select({
        id: bookings.id,
        serviceId: bookings.serviceId,
        serviceName: items.name,
        sellerName: profiles.shopName,
        shopSlug: profiles.shopSlug,
        sellerUsername: profiles.username,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        orderId: bookings.orderId,
        cancellationWindowHours: profiles.cancellationWindowHours,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(items, eq(bookings.serviceId, items.id))
      .innerJoin(profiles, eq(bookings.sellerId, profiles.id))
      .where(eq(bookings.customerPhone, phone))
      .orderBy(desc(bookings.startTime));

    // Fetch orders with items — lookup by customerPhone
    const customerOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        sellerName: profiles.shopName,
        shopSlug: profiles.shopSlug,
        sellerUsername: profiles.username,
        customerName: orders.customerName,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(profiles, eq(orders.sellerId, profiles.id))
      .where(eq(orders.customerPhone, phone))
      .orderBy(desc(orders.createdAt));

    // Fetch order items for each order
    const orderIds = customerOrders.map((o) => o.id);
    let allOrderItems: {
      id: string;
      orderId: string;
      itemName: string;
      itemType: string;
      unitPrice: string;
      quantity: number;
      subtotal: string;
    }[] = [];

    if (orderIds.length > 0) {
      allOrderItems = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          itemName: orderItems.itemName,
          itemType: orderItems.itemType,
          unitPrice: orderItems.unitPrice,
          quantity: orderItems.quantity,
          subtotal: orderItems.subtotal,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
    }

    return {
      success: true,
      bookings: customerBookings.map((b) => ({
        id: b.id,
        serviceName: b.serviceName,
        serviceId: b.serviceId,
        sellerName: b.sellerName || b.sellerUsername,
        shopSlug: b.shopSlug || b.sellerUsername,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        orderId: b.orderId,
        cancellationWindowHours: b.cancellationWindowHours ?? 24,
        createdAt: b.createdAt.toISOString(),
      })),
      orders: customerOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        sellerName: o.sellerName || o.sellerUsername,
        shopSlug: o.shopSlug || o.sellerUsername,
        customerName: o.customerName,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        items: allOrderItems
          .filter((item) => item.orderId === o.id)
          .map((item) => ({
            id: item.id,
            itemName: item.itemName,
            itemType: item.itemType,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
      })),
    };
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return { success: false, error: "خطایی در دریافت اطلاعات رخ داد" };
  }
}

// ============================================================================
// CANCEL BOOKING BY CUSTOMER (with cancellation window enforcement)
// ============================================================================

export async function cancelBookingByCustomer(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = await getAuthenticatedPhone();
    if (!phone) {
      return { success: false, error: "لطفاً ابتدا وارد شوید" };
    }

    // Fetch the booking — verify ownership by phone
    const booking = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.customerPhone, phone)),
    });

    if (!booking) {
      return { success: false, error: "رزرو یافت نشد" };
    }

    // Only pending or confirmed bookings can be cancelled
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return { success: false, error: "امکان لغو این رزرو وجود ندارد" };
    }

    // Fetch seller's cancellation window
    const seller = await db.query.profiles.findFirst({
      where: eq(profiles.id, booking.sellerId),
      columns: { cancellationWindowHours: true },
    });

    const cancellationWindowHours = seller?.cancellationWindowHours ?? 24;

    // ── Cancellation window enforcement ──
    const now = new Date();
    const appointmentTime = new Date(booking.startTime);
    const msUntilAppointment = appointmentTime.getTime() - now.getTime();
    const hoursUntilAppointment = msUntilAppointment / (1000 * 60 * 60);

    if (hoursUntilAppointment < cancellationWindowHours) {
      return {
        success: false,
        error: `لغو فقط تا ${cancellationWindowHours} ساعت قبل از نوبت امکان‌پذیر است`,
      };
    }

    // ── Execute cancellation in a transaction ──
    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledAt: now,
          cancellationReason: reason?.trim() || "لغو توسط مشتری",
          updatedAt: now,
        })
        .where(eq(bookings.id, bookingId));

      // Sync linked order status
      if (booking.orderId) {
        await tx
          .update(orders)
          .set({
            status: "cancelled",
            cancelledAt: now,
            cancellationReason: reason?.trim() || "لغو توسط مشتری",
            updatedAt: now,
          })
          .where(eq(orders.id, booking.orderId));
      }
    });

    revalidatePath("/my-orders");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, error: "خطایی در لغو رزرو رخ داد" };
  }
}

// ============================================================================
// GENERATE GOOGLE CALENDAR URL
// ============================================================================

export async function generateCalendarUrl(
  bookingId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const phone = await getAuthenticatedPhone();
    if (!phone) {
      return { success: false, error: "لطفاً ابتدا وارد شوید" };
    }

    const booking = await db
      .select({
        id: bookings.id,
        serviceName: items.name,
        sellerName: profiles.shopName,
        sellerUsername: profiles.username,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        customerPhone: bookings.customerPhone,
      })
      .from(bookings)
      .innerJoin(items, eq(bookings.serviceId, items.id))
      .innerJoin(profiles, eq(bookings.sellerId, profiles.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.customerPhone, phone)))
      .limit(1);

    if (booking.length === 0) {
      return { success: false, error: "رزرو یافت نشد" };
    }

    const b = booking[0];
    const shopName = b.sellerName || b.sellerUsername;

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
    const formatGCalDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const startFormatted = formatGCalDate(new Date(b.startTime));
    const endFormatted = formatGCalDate(new Date(b.endTime));

    const url = new URL("https://calendar.google.com/calendar/event");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", `${b.serviceName} - ${shopName}`);
    url.searchParams.set("dates", `${startFormatted}/${endFormatted}`);
    url.searchParams.set("details", `نوبت ${b.serviceName} در ${shopName}`);

    return { success: true, url: url.toString() };
  } catch (error) {
    console.error("Error generating calendar URL:", error);
    return { success: false, error: "خطایی رخ داد" };
  }
}
