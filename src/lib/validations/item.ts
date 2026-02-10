import { z } from "zod";

export const itemFormSchema = z
  .object({
    type: z.enum(["product", "service"], {
      required_error: "نوع محصول الزامی است",
    }),
    name: z
      .string()
      .min(1, "نام محصول الزامی است")
      .max(200, "نام محصول نباید بیشتر از 200 کاراکتر باشد"),
    description: z.string().optional(),
    price: z
      .string()
      .min(1, "قیمت الزامی است")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "قیمت باید عدد مثبت باشد",
      }),
    imageUrl: z.string().url("آدرس تصویر معتبر نیست").optional().or(z.literal("")),
    
    // Product fields
    stockQuantity: z.number().int().min(0, "موجودی نباید منفی باشد").optional(),
    isDigital: z.boolean().optional(),
    
    // Service fields
    durationMinutes: z.number().int().min(1, "مدت زمان باید حداقل 1 دقیقه باشد").optional(),
    
    // Common
    isActive: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "product") {
        return data.stockQuantity !== undefined;
      }
      return true;
    },
    {
      message: "موجودی برای محصول الزامی است",
      path: ["stockQuantity"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "service") {
        return data.durationMinutes !== undefined;
      }
      return true;
    },
    {
      message: "مدت زمان برای خدمت الزامی است",
      path: ["durationMinutes"],
    }
  );

export type ItemFormData = z.infer<typeof itemFormSchema>;
