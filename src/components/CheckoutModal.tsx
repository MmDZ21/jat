"use client";

import { useState, useTransition } from "react";
import { createOrder } from "@/app/actions/order-actions";
import { X, ShoppingBag, Briefcase, CheckCircle, Loader2, Package, MapPin, Mail, Phone, User, Calendar } from "lucide-react";
import type { Item } from "@/db/schema";

interface CheckoutModalProps {
  item: Item;
  sellerId: string;
  themeColor: string;
  textColor: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({
  item,
  sellerId,
  themeColor,
  textColor,
  isOpen,
  onClose,
}: CheckoutModalProps) {
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [preferredDateTime, setPreferredDateTime] = useState("");
  
  // UI state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");

  if (!isOpen) return null;

  const isProduct = item.type === "product";
  const isService = item.type === "service";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOrder(
        {
          sellerId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: isProduct ? shippingAddress : undefined,
          postalCode: isProduct ? postalCode : undefined,
          customerNote: isService ? `تاریخ و زمان ترجیحی: ${preferredDateTime}` : undefined,
          currency: "IRT",
        },
        {
          itemId: item.id,
          quantity: 1,
        }
      );

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
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setShippingAddress("");
      setPostalCode("");
      setPreferredDateTime("");
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!success ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 z-10 rounded-t-2xl">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    {isProduct ? (
                      <Package className="w-6 h-6" style={{ color: themeColor }} />
                    ) : (
                      <Briefcase className="w-6 h-6" style={{ color: themeColor }} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">تکمیل سفارش</h3>
                    <p className="text-sm text-gray-500">
                      {isProduct ? "خرید محصول" : "رزرو خدمت"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  disabled={isPending}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Item Summary */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-start gap-4">
                {item.imageUrl && (
                  <div className="w-24 h-24 rounded-xl bg-white shrink-0 overflow-hidden border border-gray-200">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold" style={{ color: themeColor }}>
                      {formatPrice(item.price)} تومان
                    </p>
                    {isService && item.durationMinutes && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.durationMinutes} دقیقه
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="customerName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
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
                  minLength={2}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="customerPhone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
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
                  minLength={10}
                  pattern="[0-9]*"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="customerEmail" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  ایمیل *
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  placeholder="ali@example.com"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Product-specific fields */}
              {isProduct && (
                <>
                  {/* Shipping Address */}
                  <div>
                    <label htmlFor="shippingAddress" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4" />
                      آدرس تحویل *
                    </label>
                    <textarea
                      id="shippingAddress"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
                      placeholder="تهران، خیابان ولیعصر، پلاک 123، واحد 5"
                      rows={3}
                      required
                      disabled={isPending}
                      minLength={10}
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                      کد پستی
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                      placeholder="1234567890"
                      disabled={isPending}
                      maxLength={10}
                      pattern="[0-9]*"
                    />
                  </div>
                </>
              )}

              {/* Service-specific fields */}
              {isService && (
                <div>
                  <label htmlFor="preferredDateTime" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ و زمان ترجیحی *
                  </label>
                  <input
                    type="text"
                    id="preferredDateTime"
                    value={preferredDateTime}
                    onChange={(e) => setPreferredDateTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    placeholder="مثال: شنبه 15 بهمن، ساعت 10 صبح"
                    required
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    فروشنده برای تایید نهایی با شما تماس خواهد گرفت
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>توجه:</strong> پس از ثبت سفارش، فروشنده برای تایید نهایی و هماهنگی با شما تماس خواهد گرفت.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: themeColor,
                  color: textColor,
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال ثبت...</span>
                  </>
                ) : (
                  <>
                    {isProduct ? <ShoppingBag className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                    <span>ثبت سفارش نهایی</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <CheckCircle className="w-12 h-12" style={{ color: themeColor }} />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              سفارش شما ثبت شد! 🎉
            </h3>
            
            <p className="text-gray-600 mb-6">
              فروشنده به زودی برای تایید نهایی با شما تماس خواهد گرفت
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">شماره پیگیری سفارش</p>
              <p className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
                {orderNumber}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                این شماره را برای پیگیری سفارش خود یادداشت کنید
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClose}
                className="w-full py-4 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: themeColor,
                  color: textColor,
                }}
              >
                بستن
              </button>
              
              <button
                onClick={handleClose}
                className="w-full py-3 px-6 rounded-xl font-medium transition-all text-gray-600 hover:bg-gray-100"
              >
                بازگشت به صفحه
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
