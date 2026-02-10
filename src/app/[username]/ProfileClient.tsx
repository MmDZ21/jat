"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Package, Briefcase, Clock } from "lucide-react";
import type { Profile, Item } from "@/db/schema";
import CheckoutModal from "@/components/CheckoutModal";

interface ProfileClientProps {
  profile: Profile & { items: Item[] };
  products: Item[];
  services: Item[];
}

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// Helper to create lighter shade for shadows
function lightenColor(hexColor: string, amount: number = 0.3): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.min(255, r + (255 - r) * amount);
  const newG = Math.min(255, g + (255 - g) * amount);
  const newB = Math.min(255, b + (255 - b) * amount);
  
  return `#${Math.round(newR).toString(16).padStart(2, "0")}${Math.round(newG).toString(16).padStart(2, "0")}${Math.round(newB).toString(16).padStart(2, "0")}`;
}

export default function ProfileClient({ profile, products, services }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  
  // Background colors based on mode
  const bgColors = {
    light: {
      primary: "#ffffff",
      secondary: "#f9fafb",
      gradient: "from-gray-50 to-white",
      text: "#111827",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
    },
    dark: {
      primary: "#1f2937",
      secondary: "#111827",
      gradient: "from-gray-900 to-gray-800",
      text: "#f9fafb",
      textSecondary: "#9ca3af",
      border: "#374151",
    },
  };
  
  const colors = bgColors[backgroundMode];

  // Memoize price formatter
  const formatPrice = useCallback((price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("fa-IR").format(numPrice);
  }, []);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Wait for animation before clearing item
    setTimeout(() => setSelectedItem(null), 200);
  };

  return (
    <div 
      className={`min-h-screen bg-linear-to-b ${colors.gradient} transition-colors`}
      dir="rtl"
    >
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Profile Header */}
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
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
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

          {/* Display Name */}
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {profile.displayName || profile.username}
          </h1>

          {/* Username */}
          <p 
            className="text-sm mb-3"
            style={{ color: colors.textSecondary }}
          >
            @{profile.username}
          </p>

          {/* Bio */}
          {profile.bio && (
            <p 
              className="text-base leading-relaxed max-w-md mb-4"
              style={{ color: colors.textSecondary }}
            >
              {profile.bio}
            </p>
          )}

          {/* Vacation Mode Banner */}
          {profile.vacationMode && (
            <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-amber-800 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                {profile.vacationMessage || "در حال حاضر در حالت تعطیلات هستیم"}
              </p>
            </div>
          )}

          {/* Contact Info */}
          {(profile.email || profile.phone) && (
            <div 
              className="flex flex-wrap items-center justify-center gap-3 text-sm"
              style={{ color: colors.textSecondary }}
            >
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: themeColor }}
                >
                  {profile.email}
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: themeColor }}
                >
                  {profile.phone}
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* Tab Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 mb-6 rounded-2xl p-1.5 shadow-sm"
          style={{
            backgroundColor: colors.primary,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <button
            onClick={() => setActiveTab("products")}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all"
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
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all"
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

        {/* Items List */}
        <div className="relative grid">
          {(["products", "services"] as const).map((tab) => {
            const tabItems = tab === "products" ? products : services;
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
                className="col-start-1 row-start-1 space-y-3"
                style={{ pointerEvents: isActive ? "auto" : "none" }}
              >
            {tabItems.length === 0 ? (
              <div className="text-center py-12">
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
            ) : (
              tabItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="rounded-2xl p-5 border transition-all cursor-pointer group"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.border,
                    boxShadow: backgroundMode === "dark" 
                      ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)" 
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                    e.currentTarget.style.borderColor = themeColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = backgroundMode === "dark"
                      ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)"
                      : "0 1px 3px 0 rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div className="flex gap-4">
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
                    <div className="flex-1 min-w-0">
                      {/* Name & Price */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 
                          className="font-bold text-gray-900 transition-colors"
                          style={{
                            color: `rgb(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)})`,
                          }}
                        >
                          {item.name}
                        </h3>
                        <div className="shrink-0">
                          <p 
                            className="font-bold whitespace-nowrap"
                            style={{ color: themeColor }}
                          >
                            {formatPrice(item.price)} تومان
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p 
                          className="text-sm line-clamp-2 mb-3"
                          style={{ color: colors.textSecondary }}
                        >
                          {item.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div 
                        className="flex flex-wrap items-center gap-3 text-xs"
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
                          <div className="flex gap-1">
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
                    </div>
                  </div>
                </div>
              ))
            )}
              </motion.div>
            );
          })}
        </div>

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

      {/* Checkout Modal */}
      {selectedItem && (
        <CheckoutModal
          item={selectedItem}
          sellerId={profile.id}
          themeColor={themeColor}
          textColor={textColor}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
