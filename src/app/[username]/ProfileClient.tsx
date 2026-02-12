"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Package, Briefcase, Clock, ShoppingCart, X, Trash2, Plus, Minus, AlertCircle, Search, LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ChevronDown, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Profile, Item } from "@/db/schema";
import { useCart } from "@/store/useCart";
import BookingModal from "@/components/BookingModal";

interface ProfileClientProps {
  profile: Profile & { items: Item[] };
  products: Item[];
  services: Item[];
  paymentStatus?: string;
}

import { getContrastColor, lightenColor } from "@/lib/color-utils";

export default function ProfileClient({ profile, products, services, paymentStatus }: ProfileClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [filterAvailability, setFilterAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Booking modal state
  const [bookingService, setBookingService] = useState<Item | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Checkout form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // Structured address fields
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [plaque, setPlaque] = useState("");
  const [unit, setUnit] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPlacingOrder, startPlaceOrder] = useTransition();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const cartItems = useCart((state) => state.items);
  const cartSellerId = useCart((state) => state.sellerId);
  const addItemToCart = useCart((state) => state.addItem);
  const removeItemFromCart = useCart((state) => state.removeItem);
  const updateCartQuantity = useCart((state) => state.updateQuantity);
  const clearCart = useCart((state) => state.clearCart);
  const cartTotalAmount = useCart((state) => state.totalAmount);

  const themeColor = profile.themeColor || "#3b82f6";
  const backgroundMode = (profile.backgroundMode as "light" | "dark") || "light";
  
  // Memoize colors
  const textColor = useMemo(() => getContrastColor(themeColor), [themeColor]);
  const shadowColor = useMemo(() => {
    if (backgroundMode === "dark") {
      // For dark mode, use a lighter, more subtle shadow
      return `${themeColor}60`;
    }
    // For light mode, use the lightened color
    return lightenColor(themeColor, 0.6);
  }, [themeColor, backgroundMode]);
  
  // Background colors based on mode — premium palette
  const bgColors = {
    light: {
      primary: "#ffffff",
      secondary: "#f8f9fb",
      gradient: "from-gray-50/80 to-white",
      text: "#111827",
      textSecondary: "#6b7280",
      textTertiary: "#9ca3af",
      border: "#e5e7eb",
      card: "#ffffff",
      cardHover: "#f9fafb",
      input: "#f9fafb",
      overlay: "rgba(0,0,0,0.4)",
      drawer: "#ffffff",
    },
    dark: {
      primary: "#0F1117",
      secondary: "#0A0C12",
      gradient: "from-[#0A0C12] to-[#0F1117]",
      text: "#E8E8ED",
      textSecondary: "#8B8BA0",
      textTertiary: "#5C5C70",
      border: "rgba(255,255,255,0.08)",
      card: "#161822",
      cardHover: "#1C1E2E",
      input: "#12141C",
      overlay: "rgba(0,0,0,0.6)",
      drawer: "#111318",
    },
  };
  
  const colors = bgColors[backgroundMode];

  // Memoize price formatter
  const formatPrice = useCallback((price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("fa-IR").format(numPrice);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (item: Item) => {
    // Block adding out-of-stock products
    if (item.type === "product" && (item.stockQuantity === null || item.stockQuantity <= 0)) {
      return;
    }

    // Enforce single-seller cart
    if (cartSellerId && cartSellerId !== profile.id) {
      const confirmClear = window.confirm(
        "سبد خرید شما مربوط به فروشگاه دیگری است. آیا می‌خواهید سبد را خالی کرده و از این فروشگاه شروع کنید؟"
      );
      if (!confirmClear) return;
      clearCart();
    }

    // Check stock limit before adding
    if (item.type === "product" && item.stockQuantity !== null) {
      const existingCartItem = cartItems.find((ci) => ci.id === item.id);
      const currentQty = existingCartItem ? existingCartItem.quantity : 0;
      if (currentQty >= item.stockQuantity) {
        return; // Already at max stock
      }
    }

    addItemToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
      sellerId: profile.id,
    });

    setJustAddedId(item.id);
    setTimeout(() => setJustAddedId(null), 1500);
    setIsCartOpen(true);
    setIsCheckingOut(false);
  };

  const handleStartCheckout = () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
  };

  const handleBackToCart = () => {
    setIsCheckingOut(false);
    setCheckoutError(null);
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    setCheckoutError(null);

    startPlaceOrder(async () => {
      try {
        const { createOrder } = await import("@/app/actions/shop-checkout");

        // Combine structured address into a single string for storage
        const fullAddress = [
          province && `استان ${province}`,
          city && `شهر ${city}`,
          street,
          plaque && `پلاک ${plaque}`,
          unit && `واحد ${unit}`,
          postalCode && `کد پستی: ${postalCode}`,
        ].filter(Boolean).join("، ");

        const result = await createOrder({
          sellerId: profile.id,
          shopSlug: profile.shopSlug || profile.username,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: fullAddress,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        });

        if (!result.success || !result.orderId) {
          const msg = result.error || "خطایی در ثبت سفارش رخ داد";
          setCheckoutError(msg);
          toast.error(msg);
          return;
        }

        toast.success("سفارش ثبت شد! در حال انتقال به درگاه پرداخت...");
        // Redirect to mock payment page
        router.push(`/checkout/mock-payment/${result.orderId}`);
      } catch (error) {
        console.error("Error placing order:", error);
        const msg = "خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.";
        setCheckoutError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div 
      className={`min-h-screen bg-linear-to-b ${colors.gradient} transition-colors`}
      dir="rtl"
    >
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Payment error banner (from failed mock payment) */}
        {paymentStatus === "failed" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">
              پرداخت انجام نشد. لطفاً دوباره تلاش کنید یا روش پرداخت دیگری را امتحان کنید.
            </p>
          </motion.div>
        )}
        {/* Shop Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-8"
        >
          {/* Avatar */}
          <div className="relative mb-4">
            <div 
              className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1"
              style={{
                background: `linear-gradient(to bottom right, ${themeColor}, ${lightenColor(themeColor, 0.2)})`,
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center overflow-hidden relative"
                style={{ backgroundColor: backgroundMode === "dark" ? "#1C1E2E" : "#f3f4f6" }}
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 96px, 112px"
                    priority
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shop Name */}
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {profile.shopName || profile.displayName || profile.username}
          </h1>

          {/* Shop Bio */}
          {profile.bio && !profile.vacationMode && (
            <p className="text-sm max-w-md mb-4" style={{ color: colors.textSecondary }}>
              {profile.bio}
            </p>
          )}

          {/* Vacation Mode: show "Shop temporarily closed" instead of small banner when full closed */}
          {profile.vacationMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md rounded-2xl border-2 p-8 text-center"
              style={{
                backgroundColor: `${colors.primary}`,
                borderColor: colors.border,
              }}
            >
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Clock className="w-10 h-10" style={{ color: themeColor }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                فروشگاه موقتاً بسته است
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {profile.vacationMessage || "به زودی برمی‌گردیم. از شکیبایی شما سپاسگزاریم."}
              </p>
            </motion.div>
          )}

        </motion.div>

        {/* Search + Tab Toggle + Items - hide when shop is closed */}
        {!profile.vacationMode && (
        <>
        {/* Search Bar */}
        {(products.length + services.length) > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-4"
          >
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی محصول یا خدمت..."
                className="w-full pr-11 pl-4 py-3 rounded-2xl border outline-none transition-all text-sm focus:ring-2"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                  // @ts-expect-error -- ring color via CSS
                  "--tw-ring-color": `${themeColor}40`,
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 mb-3 rounded-2xl p-1.5 shadow-sm"
          style={{
            backgroundColor: colors.primary,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <button
            onClick={() => setActiveTab("products")}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-3 px-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: activeTab === "products" ? themeColor : "transparent",
              color: activeTab === "products" ? textColor : colors.textSecondary,
              boxShadow: activeTab === "products" 
                ? backgroundMode === "dark"
                  ? `0 10px 15px -3px ${themeColor}50, 0 4px 6px -2px ${themeColor}30`
                  : `0 10px 15px -3px ${shadowColor}`
                : "none",
            }}
          >
            <Package className="w-5 h-5" />
            <span>محصولات</span>
            {products.length > 0 && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeTab === "products" 
                    ? `${textColor}20` 
                    : `${colors.textSecondary}20`,
                  color: activeTab === "products" ? textColor : colors.textSecondary,
                }}
              >
                {products.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-3 px-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: activeTab === "services" ? themeColor : "transparent",
              color: activeTab === "services" ? textColor : colors.textSecondary,
              boxShadow: activeTab === "services" 
                ? backgroundMode === "dark"
                  ? `0 10px 15px -3px ${themeColor}50, 0 4px 6px -2px ${themeColor}30`
                  : `0 10px 15px -3px ${shadowColor}`
                : "none",
            }}
          >
            <Briefcase className="w-5 h-5" />
            <span>خدمات</span>
            {services.length > 0 && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeTab === "services" 
                    ? `${textColor}20` 
                    : `${colors.textSecondary}20`,
                  color: activeTab === "services" ? textColor : colors.textSecondary,
                }}
              >
                {services.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* View Toggle + Filter Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-between mb-3"
        >
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.95]"
            style={{
              backgroundColor: showFilters ? `${themeColor}15` : colors.primary,
              color: showFilters ? themeColor : colors.textSecondary,
              borderWidth: 1,
              borderColor: showFilters ? `${themeColor}40` : colors.border,
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فیلتر و مرتب‌سازی</span>
            <ChevronDown 
              className="w-3 h-3 transition-transform duration-200"
              style={{ transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* View Toggle */}
          <div
            className="flex rounded-xl p-1 shadow-sm"
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <button
              onClick={() => setViewMode("grid")}
              className="h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.95]"
              style={{
                backgroundColor: viewMode === "grid" ? themeColor : "transparent",
                color: viewMode === "grid" ? textColor : colors.textSecondary,
                boxShadow: viewMode === "grid"
                  ? backgroundMode === "dark"
                    ? `0 4px 8px ${themeColor}40`
                    : `0 4px 8px ${shadowColor}`
                  : "none",
              }}
              title="نمای شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.95]"
              style={{
                backgroundColor: viewMode === "list" ? themeColor : "transparent",
                color: viewMode === "list" ? textColor : colors.textSecondary,
                boxShadow: viewMode === "list"
                  ? backgroundMode === "dark"
                    ? `0 4px 8px ${themeColor}40`
                    : `0 4px 8px ${shadowColor}`
                  : "none",
              }}
              title="نمای لیستی"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Filter & Sort Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden mb-4"
            >
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Sort */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    مرتب‌سازی
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: "default", label: "پیش‌فرض" },
                      { value: "price-asc", label: "ارزان‌ترین" },
                      { value: "price-desc", label: "گران‌ترین" },
                      { value: "name", label: "نام (الفبا)" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className="h-9 px-3 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.97]"
                        style={{
                          backgroundColor: sortBy === opt.value ? themeColor : `${colors.textSecondary}10`,
                          color: sortBy === opt.value ? textColor : colors.textSecondary,
                          boxShadow: sortBy === opt.value
                            ? backgroundMode === "dark"
                              ? `0 2px 6px ${themeColor}40`
                              : `0 2px 6px ${shadowColor}`
                            : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    <Package className="w-3.5 h-3.5" />
                    موجودی
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: "all", label: "همه" },
                      { value: "available", label: "موجود" },
                      { value: "unavailable", label: "ناموجود" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterAvailability(opt.value)}
                        className="h-9 px-3 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.97]"
                        style={{
                          backgroundColor: filterAvailability === opt.value ? themeColor : `${colors.textSecondary}10`,
                          color: filterAvailability === opt.value ? textColor : colors.textSecondary,
                          boxShadow: filterAvailability === opt.value
                            ? backgroundMode === "dark"
                              ? `0 2px 6px ${themeColor}40`
                              : `0 2px 6px ${shadowColor}`
                            : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                {(sortBy !== "default" || filterAvailability !== "all") && (
                  <button
                    onClick={() => { setSortBy("default"); setFilterAvailability("all"); }}
                    className="text-xs underline transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    بازنشانی فیلترها
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items */}
        <div className="relative grid">
          {(["products", "services"] as const).map((tab) => {
            const allTabItems = tab === "products" ? products : services;

            // 1) Search filter
            let tabItems = searchQuery.trim()
              ? allTabItems.filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                  (item.description || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
                )
              : [...allTabItems];

            // 2) Availability filter
            if (filterAvailability === "available") {
              tabItems = tabItems.filter((item) =>
                item.type === "service" || (item.stockQuantity !== null && item.stockQuantity > 0)
              );
            } else if (filterAvailability === "unavailable") {
              tabItems = tabItems.filter((item) =>
                item.type === "product" && (item.stockQuantity === null || item.stockQuantity <= 0)
              );
            }

            // 3) Sort: available first by default, then apply chosen sort
            tabItems.sort((a, b) => {
              // Always push unavailable products to bottom
              const aAvailable = a.type === "service" || (a.stockQuantity !== null && a.stockQuantity > 0);
              const bAvailable = b.type === "service" || (b.stockQuantity !== null && b.stockQuantity > 0);
              if (aAvailable && !bAvailable) return -1;
              if (!aAvailable && bAvailable) return 1;

              // Then apply sort
              switch (sortBy) {
                case "price-asc":
                  return parseFloat(a.price) - parseFloat(b.price);
                case "price-desc":
                  return parseFloat(b.price) - parseFloat(a.price);
                case "name":
                  return a.name.localeCompare(b.name, "fa");
                default:
                  return 0;
              }
            });

            const isActive = activeTab === tab;

            return (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 20,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                  delay: isActive ? 0.15 : 0,
                }}
                className={`col-start-1 row-start-1 ${
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3"
                    : "space-y-3"
                }`}
                style={{ pointerEvents: isActive ? "auto" : "none" }}
              >
            {tabItems.length === 0 ? (
              <div className={`text-center py-12 ${viewMode === "grid" ? "col-span-2" : ""}`}>
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${colors.textSecondary}20` }}
                >
                  {tab === "products" ? (
                    <Package className="w-8 h-8" style={{ color: colors.textSecondary }} />
                  ) : (
                    <Briefcase className="w-8 h-8" style={{ color: colors.textSecondary }} />
                  )}
                </div>
                <p style={{ color: colors.textSecondary }}>
                  {tab === "products"
                    ? "هیچ محصولی موجود نیست"
                    : "هیچ خدمتی موجود نیست"}
                </p>
              </div>
            ) : viewMode === "list" ? (
              /* ===== LIST VIEW ===== */
              tabItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 border transition-all duration-200 cursor-pointer group overflow-hidden"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    boxShadow: backgroundMode === "dark"
                      ? `0 0 0 1px ${colors.border}, 0 2px 8px rgba(0,0,0,0.3)`
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover;
                    e.currentTarget.style.borderColor = `${themeColor}60`;
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? `0 0 0 1px ${themeColor}30, 0 4px 12px rgba(0,0,0,0.4)`
                      : `0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px ${themeColor}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.card;
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? `0 0 0 1px ${colors.border}, 0 2px 8px rgba(0,0,0,0.3)`
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)";
                  }}
                >
                  <div className="flex gap-4 overflow-hidden">
                    {/* Image */}
                    {item.imageUrl && (
                      <div 
                        className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative"
                        style={{ backgroundColor: `${colors.textSecondary}10` }}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                      {/* Name */}
                      <h3 
                        className="font-bold text-lg mb-2 wrap-break-word"
                        style={{ 
                          color: colors.text,
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.name}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p 
                          className="text-sm line-clamp-2 mb-3 wrap-break-word"
                          style={{ 
                            color: colors.textSecondary,
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div 
                        className="flex flex-wrap items-center gap-3 text-xs mb-3"
                        style={{ color: colors.textSecondary }}
                      >
                        {/* Product: Stock */}
                        {item.type === "product" && item.stockQuantity !== null && (
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              item.stockQuantity > 0 ? "bg-green-500" : "bg-red-500"
                            }`} />
                            {item.stockQuantity > 0
                              ? `${item.stockQuantity} عدد موجود`
                              : "ناموجود"}
                          </span>
                        )}

                        {/* Product: Digital */}
                        {item.type === "product" && item.isDigital && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                            محصول دیجیتال
                          </span>
                        )}

                        {/* Service: Duration */}
                        {item.type === "service" && item.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.durationMinutes} دقیقه
                          </span>
                        )}

                        {/* Tags */}
                        {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.tags.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md text-xs"
                                style={{
                                  backgroundColor: `${colors.textSecondary}15`,
                                  color: colors.textSecondary,
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price + Action */}
                      <div className="mt-auto pt-2 border-t" style={{ borderColor: colors.border }}>
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <p 
                            className="font-bold text-base"
                            style={{ color: themeColor }}
                          >
                            {formatPrice(item.price)} تومان
                          </p>
                          {item.type === "service" ? (
                            <button
                              type="button"
                              onClick={() => { setBookingService(item); setIsBookingOpen(true); }}
                              className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                              style={{
                                backgroundColor: themeColor,
                                color: textColor,
                              }}
                            >
                              <CalendarDays className="w-4 h-4" />
                              رزرو نوبت
                            </button>
                          ) : item.type === "product" && (item.stockQuantity === null || item.stockQuantity <= 0) ? (
                            <button
                              type="button"
                              disabled
                              className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                              ناموجود
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                              style={{
                                backgroundColor: themeColor,
                                color: textColor,
                              }}
                            >
                              {justAddedId === item.id ? "✓ افزوده شد" : "افزودن به سبد"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* ===== GRID VIEW ===== */
              tabItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    boxShadow: backgroundMode === "dark"
                      ? `0 0 0 1px ${colors.border}, 0 2px 8px rgba(0,0,0,0.3)`
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover;
                    e.currentTarget.style.borderColor = `${themeColor}60`;
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? `0 0 0 1px ${themeColor}30, 0 4px 12px rgba(0,0,0,0.4)`
                      : `0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px ${themeColor}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.card;
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? `0 0 0 1px ${colors.border}, 0 2px 8px rgba(0,0,0,0.3)`
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Grid Image */}
                  <div 
                    className="relative w-full aspect-square overflow-hidden"
                    style={{ backgroundColor: `${colors.textSecondary}10` }}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === "product" ? (
                          <Package className="w-10 h-10" style={{ color: colors.textTertiary }} />
                        ) : (
                          <Briefcase className="w-10 h-10" style={{ color: colors.textTertiary }} />
                        )}
                      </div>
                    )}

                    {/* Stock badge */}
                    {item.type === "product" && item.stockQuantity !== null && item.stockQuantity <= 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        ناموجود
                      </div>
                    )}

                    {/* Digital badge */}
                    {item.type === "product" && item.isDigital && (
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        دیجیتال
                      </div>
                    )}
                  </div>

                  {/* Grid Content */}
                  <div className="p-3 flex flex-col flex-1">
                    {/* Name */}
                    <h3 
                      className="font-bold text-sm mb-1 line-clamp-2"
                      style={{ 
                        color: colors.text,
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.name}
                    </h3>

                    {/* Service duration */}
                    {item.type === "service" && item.durationMinutes && (
                      <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: colors.textSecondary }}>
                        <Clock className="w-3 h-3" />
                        <span>{item.durationMinutes} دقیقه</span>
                      </div>
                    )}

                    {/* Stock info */}
                    {item.type === "product" && item.stockQuantity !== null && item.stockQuantity > 0 && (
                      <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: colors.textSecondary }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>{item.stockQuantity} عدد موجود</span>
                      </div>
                    )}

                    {/* Price + Action */}
                    <div className="mt-auto pt-2 border-t" style={{ borderColor: colors.border }}>
                      <p 
                        className="font-bold text-sm mb-2"
                        style={{ color: themeColor }}
                      >
                        {formatPrice(item.price)} تومان
                      </p>
                      {item.type === "service" ? (
                        <button
                          type="button"
                          onClick={() => { setBookingService(item); setIsBookingOpen(true); }}
                          className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                          style={{
                            backgroundColor: themeColor,
                            color: textColor,
                          }}
                        >
                          <CalendarDays className="w-4 h-4" />
                          رزرو نوبت
                        </button>
                      ) : item.type === "product" && (item.stockQuantity === null || item.stockQuantity <= 0) ? (
                        <button
                          type="button"
                          disabled
                          className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          ناموجود
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                          style={{
                            backgroundColor: themeColor,
                            color: textColor,
                          }}
                        >
                          {justAddedId === item.id ? "✓ افزوده شد" : "افزودن به سبد"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
              </motion.div>
            );
          })}
        </div>
        </>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12 pt-8"
          style={{ borderTopColor: colors.border, borderTopWidth: 1 }}
        >
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            ساخته شده با{" "}
            <span className="text-red-500">♥</span>
            {" "}توسط JAT
          </p>
        </motion.div>
      </div>

      {/* Floating Cart Button - hidden when shop is closed */}
      {!profile.vacationMode && (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onClick={() => {
          setIsCartOpen(true);
          setIsCheckingOut(false);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl transition-transform duration-150 active:scale-95"
        style={{
          backgroundColor: themeColor,
          color: textColor,
          boxShadow: `0 10px 25px -5px ${themeColor}50, 0 8px 10px -6px ${themeColor}40`,
        }}
      >
        <ShoppingCart className="w-6 h-6" />
        {mounted && cartItems.length > 0 && (
          <span
            className="absolute -top-1 -left-1 min-w-[22px] h-[22px] rounded-full text-xs font-bold flex items-center justify-center px-1"
            style={{ backgroundColor: themeColor, color: textColor }}
          >
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </motion.button>
      )}

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: colors.overlay }}
              onClick={() => {
                if (!isPlacingOrder) {
                  setIsCartOpen(false);
                  setIsCheckingOut(false);
                }
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md shadow-2xl flex flex-col"
              dir="rtl"
              style={{
                backgroundColor: colors.drawer,
                boxShadow: backgroundMode === "dark"
                  ? "-4px 0 30px rgba(0,0,0,0.5)"
                  : "-4px 0 30px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    <ShoppingCart className="w-5 h-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.text }}>
                      {isCheckingOut ? "تکمیل اطلاعات ارسال" : "سبد خرید"}
                    </p>
                    {!isCheckingOut && (
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {cartItems.length === 0
                          ? "هیچ محصولی در سبد شما نیست"
                          : `${cartItems.length} آیتم در سبد خرید`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isPlacingOrder) {
                      setIsCartOpen(false);
                      setIsCheckingOut(false);
                    }
                  }}
                  className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-colors duration-150 active:scale-95"
                  style={{ color: colors.textSecondary }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {!isCheckingOut ? (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-sm" style={{ color: colors.textSecondary }}>
                        <ShoppingCart className="w-10 h-10 mb-2" style={{ color: colors.textTertiary }} />
                        <p>سبد خرید شما خالی است</p>
                      </div>
                    ) : (
                      <>
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 rounded-2xl border p-4"
                            style={{ borderColor: colors.border, backgroundColor: colors.card }}
                          >
                            {item.image && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: colors.input }}>
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: colors.text }}>
                                {item.name}
                              </p>
                              <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                                {formatPrice(item.price)} تومان
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                {/* Quantity controls */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartQuantity(
                                        item.id,
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    className="min-h-[44px] min-w-[44px] rounded-full border flex items-center justify-center transition-colors duration-150 active:scale-95"
                                    style={{ borderColor: colors.border, color: colors.text }}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="min-w-[28px] text-center text-sm font-medium" style={{ color: colors.text }}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Respect stock limits
                                      const product = [...products, ...services].find((p) => p.id === item.id);
                                      if (product && product.type === "product" && product.stockQuantity !== null) {
                                        if (item.quantity >= product.stockQuantity) return;
                                      }
                                      updateCartQuantity(item.id, item.quantity + 1);
                                    }}
                                    className="min-h-[44px] min-w-[44px] rounded-full border flex items-center justify-center transition-colors duration-150 active:scale-95"
                                    style={{ borderColor: colors.border, color: colors.text }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => removeItemFromCart(item.id)}
                                  className="min-h-[44px] px-3 rounded-lg text-sm flex items-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
                                  style={{ color: "#F87171" }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlaceOrder();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        نام و نام خانوادگی *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                        style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        minLength={2}
                        disabled={isPlacingOrder}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        ایمیل
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                        style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="example@email.com"
                        disabled={isPlacingOrder}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        شماره تماس *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                        style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        minLength={10}
                        disabled={isPlacingOrder}
                      />
                    </div>
                    {/* Structured address fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                          استان *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                          style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                          placeholder="مثلاً تهران"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          required
                          disabled={isPlacingOrder}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                          شهر *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                          style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                          placeholder="مثلاً تهران"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          disabled={isPlacingOrder}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                        آدرس (خیابان و کوچه) *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                        style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                        placeholder="مثلاً خیابان ولیعصر، کوچه سوم"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required
                        minLength={5}
                        disabled={isPlacingOrder}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                          پلاک *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                          style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                          placeholder="۱۲۳"
                          value={plaque}
                          onChange={(e) => setPlaque(e.target.value)}
                          required
                          disabled={isPlacingOrder}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                          واحد
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                          style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                          placeholder="۵"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          disabled={isPlacingOrder}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                          کد پستی
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                          style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }}
                          placeholder="۱۲۳۴۵۶۷۸۹۰"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          maxLength={10}
                          disabled={isPlacingOrder}
                        />
                      </div>
                    </div>

                    {checkoutError && (
                      <div className="p-3 rounded-xl border text-xs" style={{ backgroundColor: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)", color: "#F87171" }}>
                        {checkoutError}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: colors.border, color: colors.text }}>
                      <span>مبلغ کل:</span>
                      <span className="font-bold">
                        {formatPrice(cartTotalAmount().toString())} تومان
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleBackToCart}
                        className="flex-1 min-h-[44px] py-3 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                        style={{ borderColor: colors.border, color: colors.text }}
                        disabled={isPlacingOrder}
                      >
                        بازگشت به سبد
                      </button>
                      <button
                        type="submit"
                        className="flex-1 min-h-[44px] py-3 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-150 active:scale-[0.98]"
                        style={{ backgroundColor: themeColor, color: textColor }}
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? (
                          <span>در حال انتقال به درگاه...</span>
                        ) : (
                          <span>ادامه به پرداخت</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Cart footer (summary + checkout) */}
              {!isCheckingOut && cartItems.length > 0 && (
                <div className="border-t p-4 space-y-3" style={{ borderColor: colors.border }}>
                  <div className="flex items-center justify-between text-sm" style={{ color: colors.text }}>
                    <span>مبلغ کل:</span>
                    <span className="font-bold text-base">
                      {formatPrice(cartTotalAmount().toString())} تومان
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="flex-1 min-h-[44px] py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1 transition-all duration-150 active:scale-[0.98]"
                      style={{ borderColor: colors.border, color: colors.textSecondary }}
                    >
                      <Trash2 className="w-4 h-4" />
                      خالی کردن سبد
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      className="flex-1 min-h-[44px] py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-150 active:scale-[0.98]"
                      style={{
                        backgroundColor: themeColor,
                        color: textColor,
                        boxShadow: `0 4px 12px ${themeColor}30`,
                      }}
                    >
                      تسویه حساب
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => { setIsBookingOpen(false); setBookingService(null); }}
          service={{
            id: bookingService.id,
            name: bookingService.name,
            price: bookingService.price,
            durationMinutes: bookingService.durationMinutes,
            sellerId: profile.id,
          }}
          themeColor={themeColor}
          textColor={textColor}
          backgroundMode={backgroundMode}
          colors={colors}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
