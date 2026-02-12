"use server";

import { db } from "@/db";
import { orders, orderItems, items, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";

// Types
interface OrderData {
  sellerId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  postalCode?: string;
  customerNote?: string;
  currency?: string;
}

interface ItemDetails {
  itemId: string;
  quantity?: number;
  appointmentSlot?: Date | null;
}

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

/**
 * Create a complete order with automatic calculations and stock management
 * 
 * @param orderData - Customer and order information
 * @param itemDetails - Item to purchase and quantity
 * @returns Order ID and number on success, error message on failure
 */
export async function createOrder(
  orderData: OrderData,
  itemDetails: ItemDetails
): Promise<CreateOrderResult> {
  try {
    // Validate required fields
    if (!orderData.customerName || orderData.customerName.trim().length < 2) {
      return {
        success: false,
        error: "نام و نام خانوادگی باید حداقل 2 کاراکتر باشد",
      };
    }

    if (!orderData.customerPhone || orderData.customerPhone.trim().length < 10) {
      return {
        success: false,
        error: "شماره تماس معتبر نیست",
      };
    }

    if (!orderData.customerEmail || !orderData.customerEmail.includes("@")) {
      return {
        success: false,
        error: "ایمیل معتبر نیست",
      };
    }

    const quantity = itemDetails.quantity || 1;

    if (quantity < 1) {
      return {
        success: false,
        error: "تعداد باید حداقل 1 باشد",
      };
    }

    // Generate unique order number: JAT-YYYYMMDD-XXXX
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const orderNumber = `JAT-${datePart}-${randomSuffix}`;

    // Execute transaction
    const result = await db.transaction(async (tx) => {
      // 1. Fetch item details
      const item = await tx.query.items.findFirst({
        where: eq(items.id, itemDetails.itemId),
      });

      if (!item) {
        throw new Error("آیتم یافت نشد");
      }

      if (!item.isActive) {
        throw new Error("این آیتم غیرفعال است");
      }

      // 2. Check stock for products
      if (item.type === "product") {
        const currentStock = item.stockQuantity || 0;
        if (currentStock < quantity) {
          throw new Error(`موجودی کافی نیست. موجودی فعلی: ${currentStock}`);
        }
      }

      // 3. Derive seller from item (do not trust client sellerId)
      const sellerId = item.sellerId;

      const seller = await tx.query.profiles.findFirst({
        where: eq(profiles.id, sellerId),
      });

      if (!seller) {
        throw new Error("فروشنده یافت نشد");
      }

      // 4. Calculate financials
      const unitPrice = parseFloat(item.price);
      const subtotal = unitPrice * quantity;
      const feePercentage = parseFloat(seller.platformFeePercentage || "10.00"); // Default 10%
      const platformFee = (subtotal * feePercentage) / 100;
      const sellerAmount = subtotal - platformFee;
      const totalAmount = subtotal; // Can add shipping/tax later

      // 5. Create order (use item.sellerId, not client-provided sellerId)
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          sellerId,
          customerId: orderData.customerId || null,
          customerName: orderData.customerName.trim(),
          customerEmail: orderData.customerEmail.trim(),
          customerPhone: orderData.customerPhone.trim(),
          shippingAddress: orderData.shippingAddress?.trim() || null,
          postalCode: orderData.postalCode?.trim() || null,
          status: "awaiting_approval",
          paymentStatus: "pending",
          subtotal: subtotal.toFixed(2),
          platformFee: platformFee.toFixed(2),
          sellerAmount: sellerAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          currency: orderData.currency || "IRT",
          customerNote: orderData.customerNote?.trim() || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // 6. Create order item (snapshot)
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        itemId: item.id,
        itemName: item.name, // Snapshot name
        itemType: item.type, // Snapshot type
        unitPrice: item.price, // Snapshot price
        quantity,
        subtotal: subtotal.toFixed(2),
        appointmentSlot: itemDetails.appointmentSlot || null,
        durationMinutes: item.type === "service" ? item.durationMinutes : null,
      });

      // 7. Decrease stock quantity for products
      if (item.type === "product") {
        const newStock = (item.stockQuantity || 0) - quantity;
        await tx
          .update(items)
          .set({
            stockQuantity: newStock,
            updatedAt: new Date(),
          })
          .where(eq(items.id, item.id));
      }

      return newOrder;
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard");

    return {
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    console.error("Error creating order:", error);

    // Return specific error message if available
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.",
    };
  }
}

/**
 * Generate a unique order number
 * Format: JAT-YYYYMMDD-XXXX
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  
  return `JAT-${year}${month}${day}-${random}`;
}

/**
 * Fetch all orders for the current user (seller) with their order items.
 * Uses auth – do not pass sellerId from client.
 */
export async function getSellerOrders() {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, orders: [], error: "کاربر احراز هویت نشده است" };
    }

    const sellerOrders = await db.query.orders.findMany({
      where: eq(orders.sellerId, profile.id),
      with: {
        orderItems: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return {
      success: true,
      orders: sellerOrders,
    };
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return {
      success: false,
      orders: [],
      error: "خطا در بارگذاری سفارش‌ها",
    };
  }
}

/**
 * Update order status. Only the order's seller can update.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: "awaiting_approval" | "approved" | "paid" | "processing" | "completed" | "cancelled" | "refunded"
) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "approved") {
      updateData.approvedAt = new Date();
    } else if (newStatus === "completed") {
      updateData.completedAt = new Date();
    } else if (newStatus === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, orderId), eq(orders.sellerId, profile.id)))
      .returning();

    if (!updatedOrder) {
      return { success: false, error: "سفارش یافت نشد یا شما دسترسی ندارید" };
    }

    // Revalidate dashboard pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");

    return {
      success: true,
      order: updatedOrder,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "خطا در به‌روزرسانی وضعیت سفارش",
    };
  }
}
