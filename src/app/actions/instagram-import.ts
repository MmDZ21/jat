"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "./auth";
import sharp from "sharp";

interface ProductToImport {
  name: string;
  price: string;
  stock: number;
  description: string;
  imageUrl: string;
  instagramPostId: string;
}

interface ImportResult {
  success: boolean;
  error?: string;
  importedCount?: number;
}

export async function saveImportedProducts(
  products: ProductToImport[]
): Promise<ImportResult> {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return { success: false, error: "کاربر احراز هویت نشده است" };
    }

    const supabase = await createClient();
    const importedItems = [];

    for (const product of products) {
      try {
        // 1. Download image from Instagram URL
        const imageResponse = await fetch(product.imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image for ${product.name}`);
          continue;
        }

        // 2. Get image as ArrayBuffer for processing
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // 3. Optimize image with sharp
        // - Resize to max 800px width (maintain aspect ratio)
        // - Convert to WebP format
        // - Set quality to 80
        const optimizedImageBuffer = await sharp(imageBuffer)
          .resize(800, null, {
            fit: "inside",
            withoutEnlargement: true, // Don't upscale smaller images
          })
          .webp({ quality: 80 })
          .toBuffer();

        // 4. Prepare filename with .webp extension
        // Use userId (Supabase auth ID) for RLS policy compliance
        const fileName = `${profile.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

        // 5. Upload optimized image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, optimizedImageBuffer, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Upload error for ${product.name}:`, uploadError);
          
          // Check if it's a bucket not found error
          if (uploadError.message?.includes("Bucket not found") || uploadError.statusCode === "404") {
            return {
              success: false,
              error: "باکت ذخیره‌سازی تصاویر یافت نشد. لطفاً ابتدا باکت product-images را در Supabase ایجاد کنید.",
            };
          }
          continue;
        }

        // 3. Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(uploadData.path);

        // 6. Insert into items table
        await db.insert(items).values({
          sellerId: profile.id,
          type: "product",
          name: product.name,
          description: product.description,
          price: product.price,
          currency: "IRT",
          imageUrl: publicUrl,
          stockQuantity: product.stock,
          isDigital: false,
          isActive: true,
          metadata: {
            source: "instagram",
            instagramPostId: product.instagramPostId,
            importedAt: new Date().toISOString(),
            imageOptimized: true,
            imageFormat: "webp",
            originalUrl: product.imageUrl,
          },
        });

        importedItems.push(product.name);
      } catch (itemError) {
        console.error(`Error importing ${product.name}:`, itemError);
        // Continue with next item
      }
    }

    if (importedItems.length === 0) {
      return {
        success: false,
        error: "هیچ محصولی ایمپورت نشد. لطفاً دوباره تلاش کنید.",
      };
    }

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return {
      success: true,
      importedCount: importedItems.length,
    };
  } catch (error) {
    console.error("Error in saveImportedProducts:", error);
    return {
      success: false,
      error: "خطا در ذخیره محصولات. لطفاً دوباره تلاش کنید.",
    };
  }
}
