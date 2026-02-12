"use client";

import { useState, useRef } from "react";
import { createItem } from "@/app/actions/items";
import type { ItemFormData } from "@/lib/validations/item";
import { Package, Briefcase, Upload, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface AddItemFormProps {
  sellerId: string;
}

export default function AddItemForm({ sellerId }: AddItemFormProps) {
  const router = useRouter();
  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<ItemFormData>>({
    type: "product",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stockQuantity: 0,
    isDigital: false,
    durationMinutes: 30,
    isActive: true,
    tags: [],
  });

  const handleTypeToggle = (type: "product" | "service") => {
    setItemType(type);
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    setIsUploading(true);

    try {
      // Create a local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const fileExt = file.name.split(".").pop();
      const fileName = `${sellerId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (error) {
        // If storage bucket doesn't exist, fallback to URL mode
        console.warn(
          "Storage upload failed, user can paste URL instead:",
          error.message
        );
        toast.error(
          "آپلود تصویر ناموفق بود. لطفاً آدرس URL تصویر را وارد کنید."
        );
        setImagePreview(null);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      setFormData((prev) => ({ ...prev, imageUrl: urlData.publicUrl }));
      toast.success("تصویر با موفقیت آپلود شد");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود تصویر");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit: ItemFormData = {
        ...formData,
        type: itemType,
        price: formData.price || "0",
        stockQuantity:
          itemType === "product" ? Number(formData.stockQuantity) : undefined,
        durationMinutes:
          itemType === "service"
            ? Number(formData.durationMinutes)
            : undefined,
        isDigital: itemType === "product" ? formData.isDigital : undefined,
      } as ItemFormData;

      const result = await createItem(dataToSubmit);

      if (result.success) {
        toast.success("محصول با موفقیت اضافه شد!");
        setFormData({
          type: itemType,
          name: "",
          description: "",
          price: "",
          imageUrl: "",
          stockQuantity: 0,
          isDigital: false,
          durationMinutes: 30,
          isActive: true,
          tags: [],
        });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.error || "خطایی رخ داد");
      }
    } catch {
      toast.error("خطایی در ارسال فرم رخ داد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6" dir="rtl">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="p-6"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            افزودن محصول جدید
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            محصول یا خدمت جدید خود را اضافه کنید
          </p>
        </div>

        {/* Type Toggle */}
        <div
          className="p-6"
          style={{ backgroundColor: "var(--bg-elevated)" }}
        >
          <div
            className="flex gap-2 p-1.5 rounded-xl"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => handleTypeToggle("product")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 min-h-[44px]"
              style={{
                backgroundColor:
                  itemType === "product"
                    ? "var(--accent-soft)"
                    : "transparent",
                color:
                  itemType === "product"
                    ? "var(--accent-text)"
                    : "var(--text-secondary)",
                border:
                  itemType === "product"
                    ? "1px solid rgba(139,92,246,0.2)"
                    : "1px solid transparent",
                boxShadow:
                  itemType === "product"
                    ? "0 0 12px var(--accent-glow)"
                    : "none",
              }}
            >
              <Package className="w-5 h-5" />
              <span>محصول</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle("service")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 min-h-[44px]"
              style={{
                backgroundColor:
                  itemType === "service"
                    ? "var(--accent-soft)"
                    : "transparent",
                color:
                  itemType === "service"
                    ? "var(--accent-text)"
                    : "var(--text-secondary)",
                border:
                  itemType === "service"
                    ? "1px solid rgba(139,92,246,0.2)"
                    : "1px solid transparent",
                boxShadow:
                  itemType === "service"
                    ? "0 0 12px var(--accent-glow)"
                    : "none",
              }}
            >
              <Briefcase className="w-5 h-5" />
              <span>خدمت</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              نام {itemType === "product" ? "محصول" : "خدمت"} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
              placeholder={
                itemType === "product"
                  ? "مثال: تی‌شرت طرح دار"
                  : "مثال: مشاوره کسب‌وکار"
              }
              required
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              توضیحات
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
              placeholder="توضیحات کامل را وارد کنید..."
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              قیمت (تومان) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
              placeholder="۵۰,۰۰۰"
              min="0"
              step="1000"
              required
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              تصویر محصول
            </label>
            {/* Upload area */}
            {!imagePreview && !formData.imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                style={{
                  border: "2px dashed var(--border-default)",
                  backgroundColor: "var(--bg-input)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor =
                    "var(--accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--border-default)";
                  e.currentTarget.style.backgroundColor =
                    "var(--bg-input)";
                }}
              >
                <ImagePlus
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  کلیک کنید یا تصویر را بکشید
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  PNG, JPG, WebP - حداکثر ۵ مگابایت
                </p>
                {isUploading && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: "var(--accent)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--accent-text)" }}
                    >
                      در حال آپلود...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="relative w-full h-40">
                  <Image
                    src={imagePreview || formData.imageUrl || ""}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 left-2 p-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: "var(--error)",
                    color: "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.85";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* URL fallback */}
            <div className="mt-3">
              <p
                className="text-xs mb-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                یا آدرس URL تصویر:
              </p>
              <div className="relative">
                <Upload
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreview(null);
                  }}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl outline-none transition-all text-sm"
                  placeholder="https://example.com/image.jpg"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--border-focus)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--border-default)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Product-specific fields */}
          {itemType === "product" && (
            <>
              <div>
                <label
                  htmlFor="stockQuantity"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  موجودی انبار *
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockQuantity: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                  placeholder="۱۰"
                  min="0"
                  required
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--border-focus)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--border-default)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <label
                htmlFor="isDigital"
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isDigital"
                    checked={formData.isDigital}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isDigital: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-all peer-checked:border-transparent"
                    style={{
                      backgroundColor: formData.isDigital
                        ? "var(--accent)"
                        : "var(--bg-input)",
                      border: formData.isDigital
                        ? "none"
                        : "1px solid var(--border-default)",
                    }}
                  >
                    {formData.isDigital && (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  محصول دیجیتال است
                </span>
              </label>
            </>
          )}

          {/* Service-specific fields */}
          {itemType === "service" && (
            <div>
              <label
                htmlFor="durationMinutes"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                مدت زمان (دقیقه) *
              </label>
              <input
                type="number"
                id="durationMinutes"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                placeholder="۳۰"
                min="1"
                required
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-focus)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px var(--accent-soft)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--border-default)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          {/* Active Status */}
          <label
            htmlFor="isActive"
            className="flex items-center gap-3 pt-2 cursor-pointer"
          >
            <div className="relative">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="sr-only peer"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{
                  backgroundColor: formData.isActive
                    ? "var(--accent)"
                    : "var(--bg-input)",
                  border: formData.isActive
                    ? "none"
                    : "1px solid var(--border-default)",
                }}
              >
                {formData.isActive && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              فعال و قابل نمایش باشد
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px]"
            style={{
              background: isLoading
                ? "var(--bg-hover)"
                : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: isLoading ? "var(--text-tertiary)" : "#fff",
              boxShadow: isLoading
                ? "none"
                : "0 4px 16px var(--accent-glow)",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px var(--accent-glow)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow =
                  "0 4px 16px var(--accent-glow)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <span>افزودن محصول</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
