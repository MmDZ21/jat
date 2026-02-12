"use server";

import { db } from "@/db";
import { orders, orderItems, items, profiles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface CartOrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
}

interface CreateCartOrderInput {
  sellerId: string;
  shopSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: CartOrderItem[];
}

/** Generate a robust 6-char alphanumeric suffix for order numbers (fits varchar 20). */
function generateOrderSuffix(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex chars → 19 total
}

export async function createOrder(
  data: CreateCartOrderInput
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Basic validation
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: "نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد" };
    }

    if (!data.customerPhone || data.customerPhone.trim().length < 10) {
      return { success: false, error: "شماره تماس معتبر نیست" };
    }

    if (!data.shippingAddress || data.shippingAddress.trim().length < 10) {
      return { success: false, error: "آدرس تحویل باید حداقل ۱۰ کاراکتر باشد" };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "سبد خرید خالی است" };
    }

    const itemIds = data.items.map((item) => item.id);

    const dbItems = await db.query.items.findMany({
      where: inArray(items.id, itemIds),
    });

    if (dbItems.length !== itemIds.length) {
      return { success: false, error: "برخی از محصولات یافت نشدند. لطفاً صفحه را رفرش کنید." };
    }

    const sellerId = dbItems[0]!.sellerId;

    for (const cartItem of data.items) {
      const dbItem = dbItems.find((it) => it.id === cartItem.id);
      if (!dbItem) {
        return { success: false, error: "محصولی یافت نشد. لطفاً دوباره تلاش کنید." };
      }
      if (dbItem.sellerId !== sellerId) {
        return { success: false, error: "همه محصولات باید متعلق به یک فروشنده باشند." };
      }
      if (!dbItem.isActive) {
        return { success: false, error: `محصول "${dbItem.name}" غیرفعال است.` };
      }
      // Validate stock for product items
      if (dbItem.type === "product") {
        const currentStock = dbItem.stockQuantity || 0;
        if (currentStock < cartItem.quantity) {
          return { success: false, error: `موجودی "${dbItem.name}" کافی نیست. موجودی فعلی: ${currentStock}` };
        }
      }
    }

    const seller = await db.query.profiles.findFirst({
      where: eq(profiles.id, sellerId),
    });

    const feePercentage = parseFloat(seller?.platformFeePercentage || "10.00");

    let subtotal = 0;
    for (const cartItem of data.items) {
      const dbItem = dbItems.find((it) => it.id === cartItem.id)!;
      subtotal += parseFloat(dbItem.price) * cartItem.quantity;
    }

    const platformFee = (subtotal * feePercentage) / 100;
    const sellerAmount = subtotal - platformFee;
    const totalAmount = subtotal;

    // Robust order number: JAT-YYYYMMDD-XXXXXXXX
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const orderNumber = `JAT-${datePart}-${generateOrderSuffix()}`;

    // Create order, items, AND reserve stock in one transaction
    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          sellerId,
          customerId: null,
          customerName: data.customerName.trim(),
          customerEmail: data.customerEmail?.trim() || "",
          customerPhone: data.customerPhone.trim(),
          shippingAddress: data.shippingAddress.trim(),
          status: "approved",
          paymentStatus: "pending",
          subtotal: subtotal.toFixed(2),
          platformFee: platformFee.toFixed(2),
          sellerAmount: sellerAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          currency: "IRT",
        })
        .returning({ id: orders.id });

      for (const cartItem of data.items) {
        const dbItem = dbItems.find((it) => it.id === cartItem.id)!;
        const unitPrice = parseFloat(dbItem.price);
        const lineSubtotal = unitPrice * cartItem.quantity;

        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          itemId: dbItem.id,
          itemName: dbItem.name,
          itemType: dbItem.type,
          unitPrice: dbItem.price,
          quantity: cartItem.quantity,
          subtotal: lineSubtotal.toFixed(2),
          appointmentSlot: null,
          durationMinutes: dbItem.type === "service" ? dbItem.durationMinutes : null,
        });

        // STOCK RESERVATION: deduct stock immediately when order is created
        if (dbItem.type === "product") {
          const currentStock = dbItem.stockQuantity || 0;
          await tx
            .update(items)
            .set({ stockQuantity: currentStock - cartItem.quantity, updatedAt: new Date() })
            .where(eq(items.id, dbItem.id));
        }
      }

      return newOrder;
    });

    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, sellerId) });
    const shopSlug = profile?.shopSlug || profile?.username;
    if (shopSlug) revalidatePath(`/shop/${shopSlug}`);

    return { success: true, orderId: result.id };
  } catch (error) {
    console.error("Error creating cart order:", error);
    return { success: false, error: "خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید." };
  }
}

