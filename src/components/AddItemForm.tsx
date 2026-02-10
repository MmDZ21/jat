"use client";

import { useState } from "react";
import { createItem } from "@/app/actions/items";
import type { ItemFormData } from "@/lib/validations/item";
import { Package, Briefcase, Upload, Loader2 } from "lucide-react";

interface AddItemFormProps {
  sellerId: string;
}

export default function AddItemForm({ sellerId }: AddItemFormProps) {
  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const dataToSubmit: ItemFormData = {
        ...formData,
        type: itemType,
        price: formData.price || "0",
        stockQuantity: itemType === "product" ? Number(formData.stockQuantity) : undefined,
        durationMinutes: itemType === "service" ? Number(formData.durationMinutes) : undefined,
        isDigital: itemType === "product" ? formData.isDigital : undefined,
      } as ItemFormData;

      const result = await createItem(sellerId, dataToSubmit);

      if (result.success) {
        setSuccess(true);
        // Reset form
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
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "خطایی رخ داد");
      }
    } catch (err) {
      setError("خطایی در ارسال فرم رخ داد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900">افزودن محصول جدید</h2>
          <p className="text-sm text-gray-500 mt-1">محصول یا خدمت جدید خود را اضافه کنید</p>
        </div>

        {/* Type Toggle */}
        <div className="p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeToggle("product")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                itemType === "product"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>محصول</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle("service")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                itemType === "service"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              نام {itemType === "product" ? "محصول" : "خدمت"} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              placeholder={itemType === "product" ? "مثال: تی‌شرت طرح دار" : "مثال: مشاوره کسب‌وکار"}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              توضیحات
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
              placeholder="توضیحات کامل را وارد کنید..."
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              قیمت (تومان) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              placeholder="۵۰,۰۰۰"
              min="0"
              step="1000"
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              آدرس تصویر
            </label>
            <div className="relative">
              <Upload className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Product-specific fields */}
          {itemType === "product" && (
            <>
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                  موجودی انبار *
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  placeholder="۱۰"
                  min="0"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDigital"
                  checked={formData.isDigital}
                  onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDigital" className="text-sm font-medium text-gray-700">
                  محصول دیجیتال است
                </label>
              </div>
            </>
          )}

          {/* Service-specific fields */}
          {itemType === "service" && (
            <div>
              <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                مدت زمان (دقیقه) *
              </label>
              <input
                type="number"
                id="durationMinutes"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                placeholder="۳۰"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">مدت زمان ارائه خدمت به دقیقه</p>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              فعال و قابل نمایش باشد
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              محصول با موفقیت اضافه شد! ✓
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:shadow-none"
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
