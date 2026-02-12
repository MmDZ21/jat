"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";
import { itemFormSchema, type ItemFormData } from "@/lib/validations/item";

export async function createItem(data: ItemFormData) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const validation = itemFormSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "داده‌های ورودی نامعتبر است" };
    }

    const validated = validation.data;

    await db.insert(items).values({
      sellerId: profile.id,
      type: validated.type,
      name: validated.name,
      description: validated.description || null,
      price: validated.price,
      imageUrl: validated.imageUrl || null,
      stockQuantity: validated.type === "product" ? validated.stockQuantity ?? 0 : null,
      isDigital: validated.type === "product" ? validated.isDigital ?? false : false,
      durationMinutes: validated.type === "service" ? validated.durationMinutes ?? 30 : null,
      isActive: validated.isActive ?? true,
      tags: validated.tags || [],
      currency: "IRT",
    });

    revalidatePath("/dashboard");
    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error creating item:", error);
    return { success: false, error: "خطایی در ایجاد محصول رخ داد" };
  }
}

export async function updateItem(
  itemId: string,
  data: {
    name?: string;
    description?: string;
    price?: string;
    imageUrl?: string;
    stockQuantity?: number;
    isDigital?: boolean;
    durationMinutes?: number;
    isActive?: boolean;
  }
) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    // Only allow updating own items
    const [updated] = await db
      .update(items)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.isDigital !== undefined && { isDigital: data.isDigital }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.sellerId, profile.id)))
      .returning();

    if (!updated) {
      return { success: false, error: "محصول یافت نشد یا دسترسی ندارید" };
    }

    revalidatePath("/dashboard");
    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating item:", error);
    return { success: false, error: "خطایی در به‌روزرسانی محصول رخ داد" };
  }
}

export async function deleteItem(itemId: string) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    try {
      // Attempt hard delete first
      const [deleted] = await db
        .delete(items)
        .where(and(eq(items.id, itemId), eq(items.sellerId, profile.id)))
        .returning();

      if (!deleted) {
        return { success: false, error: "محصول یافت نشد یا دسترسی ندارید" };
      }
    } catch (deleteError: unknown) {
      // Foreign key constraint (item has orders) → soft-delete instead
      const pgError = deleteError as { cause?: { code?: string } };
      if (pgError?.cause?.code === "23503") {
        const [deactivated] = await db
          .update(items)
          .set({ isActive: false, updatedAt: new Date() })
          .where(and(eq(items.id, itemId), eq(items.sellerId, profile.id)))
          .returning();

        if (!deactivated) {
          return { success: false, error: "محصول یافت نشد یا دسترسی ندارید" };
        }

        revalidatePath("/dashboard");
        const slug = profile.shopSlug || profile.username;
        if (slug) revalidatePath(`/shop/${slug}`);

        return {
          success: true,
          softDeleted: true,
          message: "این محصول سفارش‌های ثبت‌شده دارد و حذف کامل ممکن نیست. محصول غیرفعال شد و دیگر در فروشگاه نمایش داده نمی‌شود.",
        };
      }
      throw deleteError;
    }

    revalidatePath("/dashboard");
    const slug = profile.shopSlug || profile.username;
    if (slug) revalidatePath(`/shop/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    return { success: false, error: "خطایی در حذف محصول رخ داد" };
  }
}

export async function getSellerItems() {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, items: [], error: "کاربر احراز هویت نشده است" };
    }

    const sellerItems = await db.query.items.findMany({
      where: eq(items.sellerId, profile.id),
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    return { success: true, items: sellerItems };
  } catch (error) {
    console.error("Error fetching seller items:", error);
    return { success: false, items: [], error: "خطا در بارگذاری محصولات" };
  }
}
