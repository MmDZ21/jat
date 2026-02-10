"use client";

import { useState, useTransition } from "react";
import { createQuickOrder } from "@/app/actions/orders";
import { X, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import type { Item } from "@/db/schema";

interface QuickBuyModalProps {
  item: Item;
  sellerId: string;
  themeColor: string;
  textColor: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickBuyModal({
  item,
  sellerId,
  themeColor,
  textColor,
  isOpen,
  onClose,
}: QuickBuyModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createQuickOrder({
        sellerId,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        itemPrice: item.price,
        customerName,
        customerPhone,
      });

      if (result.success) {
        setSuccess(true);
        setOrderNumber(result.orderNumber || "");
      } else {
        setError(result.error || "خطایی رخ داد");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setCustomerName("");
      setCustomerPhone("");
      setError(null);
      setSuccess(false);
      setOrderNumber("");
      onClose();
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("fa-IR").format(numPrice);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!success ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${themeColor}20` }}
                >
                  <ShoppingBag className="w-5 h-5" style={{ color: themeColor }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">خرید سریع</h3>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Item Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                {item.imageUrl && (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <p className="font-bold" style={{ color: themeColor }}>
                    {formatPrice(item.price)} تومان
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  placeholder="علی احمدی"
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  شماره تماس *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  placeholder="09123456789"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  backgroundColor: themeColor,
                  color: textColor,
                  boxShadow: `0 10px 15px -3px ${themeColor}40`,
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال ثبت...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>ثبت سفارش</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                با ثبت سفارش، فروشنده با شما تماس خواهد گرفت
              </p>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: themeColor }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              سفارش شما ثبت شد!
            </h3>
            <p className="text-gray-600 mb-4">
              فروشنده به زودی با شما تماس خواهد گرفت
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">شماره سفارش</p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {orderNumber}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 px-6 rounded-xl font-bold transition-all"
              style={{
                backgroundColor: themeColor,
                color: textColor,
              }}
            >
              بستن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
