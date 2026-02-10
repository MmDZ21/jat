"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { revalidatePath } from "next/cache";

interface CreateOrderData {
  sellerId: string;
  itemId: string;
  itemName: string;
  itemType: "product" | "service";
  itemPrice: string;
  customerName: string;
  customerPhone: string;
}

export async function createQuickOrder(
  data: CreateOrderData
): Promise<{ success: boolean; error?: string; orderNumber?: string }> {
  try {
    // Validate customer info
    if (!data.customerName || data.customerName.trim().length < 2) {
      return {
        success: false,
        error: "نام و نام خانوادگی باید حداقل 2 کاراکتر باشد",
      };
    }

    if (!data.customerPhone || data.customerPhone.trim().length < 10) {
      return {
        success: false,
        error: "شماره تماس معتبر نیست",
      };
    }

    // Generate order number
    const orderNumber = `JAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const price = parseFloat(data.itemPrice);
    const platformFeePercentage = 10; // 10% platform fee
    const platformFee = (price * platformFeePercentage) / 100;
    const sellerAmount = price - platformFee;

    // Create order in transaction
    const result = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          sellerId: data.sellerId,
          customerId: null, // Guest order
          customerName: data.customerName.trim(),
          customerEmail: "", // Not collected in quick buy
          customerPhone: data.customerPhone.trim(),
          status: "awaiting_approval",
          paymentStatus: "pending",
          subtotal: data.itemPrice,
          platformFee: platformFee.toFixed(2),
          sellerAmount: sellerAmount.toFixed(2),
          totalAmount: data.itemPrice,
          currency: "IRT",
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // Create order item
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        itemId: data.itemId,
        itemName: data.itemName,
        itemType: data.itemType,
        unitPrice: data.itemPrice,
        quantity: 1,
        subtotal: data.itemPrice,
        appointmentSlot: null, // Can be set later for services
        durationMinutes: null,
      });

      return newOrder;
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard");

    return {
      success: true,
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    console.error("Error creating order:", error);

    return {
      success: false,
      error: "خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.",
    };
  }
}
