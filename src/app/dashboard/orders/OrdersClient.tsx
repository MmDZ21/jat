"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/actions/order-actions";
import { iranYekan } from "@/app/fonts";

type OrderStatus =
  | "awaiting_approval"
  | "approved"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

interface OrderItem {
  id: string;
  itemName: string;
  itemType: "product" | "service";
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string | null;
  postalCode: string | null;
  status: OrderStatus;
  totalAmount: string;
  createdAt: Date;
  orderItems: OrderItem[];
}

interface OrdersClientProps {
  orders: Order[];
  sellerId: string;
}

// Status configurations with colors and labels
const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; actions: OrderStatus[] }
> = {
  awaiting_approval: {
    label: "در انتظار تایید",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    actions: ["approved", "cancelled"],
  },
  approved: {
    label: "تایید شده",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    actions: ["processing", "cancelled"],
  },
  paid: {
    label: "پرداخت شده",
    color: "text-green-700",
    bgColor: "bg-green-100",
    actions: ["processing"],
  },
  processing: {
    label: "در حال آماده‌سازی",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    actions: ["completed"],
  },
  completed: {
    label: "تکمیل شده",
    color: "text-green-800",
    bgColor: "bg-green-200",
    actions: [],
  },
  cancelled: {
    label: "لغو شده",
    color: "text-red-700",
    bgColor: "bg-red-100",
    actions: [],
  },
  refunded: {
    label: "بازگشت وجه",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    actions: [],
  },
};

// Action button labels
const actionLabels: Record<OrderStatus, string> = {
  awaiting_approval: "در انتظار تایید",
  approved: "تایید سفارش",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شدن",
  cancelled: "لغو",
  refunded: "بازگشت وجه",
};

export default function OrdersClient({ orders, sellerId }: OrdersClientProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        alert(result.error || "خطا در به‌روزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("خطا در به‌روزرسانی وضعیت");
    } finally {
      setIsUpdating(null);
    }
  };

  const toggleDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("fa-IR").format(parseFloat(price));
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 ${iranYekan.variable} font-sans`}
      style={{ fontFamily: "var(--font-iran-yekan)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مدیریت سفارش‌ها
          </h1>
          <p className="text-gray-600">
            مجموع {orders.length} سفارش
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              هنوز سفارشی ندارید
            </h2>
            <p className="text-gray-500">
              وقتی مشتریان سفارش ثبت کنند، اینجا نمایش داده می‌شود
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status];
              const isExpanded = expandedOrder === order.id;
              const isLoading = isUpdating === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Main Card Content */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      {/* Order Number & Status */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bgColor}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      {/* Total Price */}
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-500">مبلغ کل</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(order.totalAmount)} تومان
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-700">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📅</span>
                        <span className="text-gray-600 text-sm">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 mb-2">آیتم‌های سفارش:</p>
                      <div className="space-y-1">
                        {order.orderItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {item.itemName} (×{item.quantity})
                            </span>
                            <span className="text-gray-600 font-medium">
                              {formatPrice(item.subtotal)} تومان
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Details Toggle Button */}
                      <button
                        onClick={() => toggleDetails(order.id)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                      >
                        {isExpanded ? "بستن جزئیات" : "مشاهده جزئیات"}
                      </button>

                      {/* Status Update Actions */}
                      {config.actions.map((action) => {
                        const actionConfig = statusConfig[action];
                        return (
                          <button
                            key={action}
                            onClick={() => handleStatusUpdate(order.id, action)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                              isLoading
                                ? "bg-gray-300 cursor-not-allowed"
                                : action === "cancelled"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : action === "completed"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                          >
                            {isLoading ? "در حال بروزرسانی..." : actionLabels[action]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        اطلاعات تماس و ارسال
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">شماره تماس</p>
                          <p className="text-gray-800 font-medium">
                            {order.customerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">ایمیل</p>
                          <p className="text-gray-800 font-medium">
                            {order.customerEmail || "—"}
                          </p>
                        </div>
                        {order.shippingAddress && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500 mb-1">آدرس ارسال</p>
                            <p className="text-gray-800">
                              {order.shippingAddress}
                            </p>
                            {order.postalCode && (
                              <p className="text-gray-600 text-sm mt-1">
                                کد پستی: {order.postalCode}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
