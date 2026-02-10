"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { itemFormSchema, type ItemFormData } from "@/lib/validations/item";
import { revalidatePath } from "next/cache";

export async function createItem(
  sellerId: string,
  data: ItemFormData
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  try {
    // Validate data
    const validatedData = itemFormSchema.parse(data);

    // Prepare the item data
    const itemData = {
      sellerId,
      type: validatedData.type,
      name: validatedData.name,
      description: validatedData.description || null,
      price: validatedData.price,
      currency: "IRT", // Iranian Toman
      imageUrl: validatedData.imageUrl || null,
      isActive: validatedData.isActive,
      tags: validatedData.tags || null,
      
      // Product-specific
      stockQuantity: validatedData.type === "product" ? validatedData.stockQuantity : null,
      isDigital: validatedData.type === "product" ? (validatedData.isDigital || false) : null,
      
      // Service-specific
      durationMinutes: validatedData.type === "service" ? validatedData.durationMinutes : null,
    };

    // Insert into database
    const result = await db.insert(items).values(itemData).returning({ id: items.id });
    const newItem = result[0];

    if (!newItem?.id) {
      throw new Error("Failed to create item");
    }

    // Revalidate the dashboard or items page
    revalidatePath("/dashboard");

    return {
      success: true,
      itemId: newItem.id,
    };
  } catch (error) {
    console.error("Error creating item:", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: "خطایی در ایجاد محصول رخ داد",
    };
  }
}
