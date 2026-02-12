"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Package,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { iranYekan } from "@/app/fonts";
import { updateItem, deleteItem } from "@/app/actions/items";
import { logout } from "@/app/actions/auth";
import SuccessBanner from "./SuccessBanner";
import AddItemForm from "@/components/AddItemForm";
import type { Profile, Item } from "@/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardClientProps {
  profile: Profile;
  items: Item[];
  showImportSuccess: boolean;
  importCount: number;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.15 },
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DashboardClient({
  profile,
  items: initialItems,
  showImportSuccess,
  importCount,
}: DashboardClientProps) {
  const router = useRouter();

  // Edit modal state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stockQuantity: 0,
    durationMinutes: 30,
    isActive: true,
  });
  const [isSaving, startSaveTransition] = useTransition();

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // -----------------------------------------------------------
  // Edit handlers
  // -----------------------------------------------------------

  function openEditModal(item: Item) {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      imageUrl: item.imageUrl ?? "",
      stockQuantity: item.stockQuantity ?? 0,
      durationMinutes: item.durationMinutes ?? 30,
      isActive: item.isActive ?? true,
    });
  }

  function closeEditModal() {
    setEditingItem(null);
  }

  function handleEditSave() {
    if (!editingItem) return;
    startSaveTransition(async () => {
      const result = await updateItem(editingItem.id, {
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        imageUrl: editForm.imageUrl,
        stockQuantity:
          editingItem.type === "product" ? editForm.stockQuantity : undefined,
        durationMinutes:
          editingItem.type === "service" ? editForm.durationMinutes : undefined,
        isActive: editForm.isActive,
      });

      if (result.success) {
        toast.success("محصول با موفقیت به‌روزرسانی شد");
        closeEditModal();
        router.refresh();
      } else {
        toast.error(result.error ?? "خطا در به‌روزرسانی");
      }
    });
  }

  // -----------------------------------------------------------
  // Delete handlers
  // -----------------------------------------------------------

  function openDeleteDialog(item: Item) {
    setDeletingItem(item);
  }

  function closeDeleteDialog() {
    setDeletingItem(null);
  }

  function handleDeleteConfirm() {
    if (!deletingItem) return;
    startDeleteTransition(async () => {
      const result = await deleteItem(deletingItem.id);
      if (result.success) {
        toast.success("محصول با موفقیت حذف شد");
        closeDeleteDialog();
        router.refresh();
      } else {
        toast.error(result.error ?? "خطا در حذف محصول");
      }
    });
  }

  // -----------------------------------------------------------
  // Rendered dashboard
  // -----------------------------------------------------------

  const shopUrl = `/shop/${profile.shopSlug || profile.username}`;

  return (
    <div
      dir="rtl"
      className={`min-h-screen ${iranYekan.variable}`}
      style={{
        background: "var(--bg-base)",
        fontFamily: "var(--font-iran-yekan)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Import Success Banner */}
        {showImportSuccess && importCount > 0 && (
          <SuccessBanner count={importCount} />
        )}

        {/* ============================================================= */}
        {/* HEADER                                                         */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                داشبورد فروشنده
              </h1>
              <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                خوش آمدید، {profile.displayName || profile.username}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: "var(--error-soft)",
                  color: "var(--error)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--error-soft)";
                  e.currentTarget.style.color = "var(--error)";
                }}
              >
                خروج
              </button>
            </form>
          </div>
        </motion.div>

        {/* ============================================================= */}
        {/* NAVIGATION LINKS                                               */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          {[
            { href: "/dashboard/orders", icon: Package, label: "سفارش‌ها" },
            { href: "/dashboard/import", icon: null, label: "ایمپورت" },
            { href: "/dashboard/settings", icon: null, label: "تنظیمات" },
            { href: shopUrl, icon: ExternalLink, label: "مشاهده فروشگاه" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-default)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              {link.icon && <link.icon className="w-5 h-5" />}
              {link.label}
            </Link>
          ))}
        </motion.div>

        {/* ============================================================= */}
        {/* ITEMS LIST                                                     */}
        {/* ============================================================= */}
        <section className="mb-8">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            محصولات و خدمات
          </h2>

          {initialItems.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Package
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                هنوز محصول یا خدمتی اضافه نشده است
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                از فرم پایین برای افزودن اولین محصول استفاده کنید
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  className="rounded-2xl overflow-hidden group transition-all duration-200"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-card)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative h-44"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {item.type === "product" ? (
                          <Package
                            className="w-12 h-12"
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        ) : (
                          <Briefcase
                            className="w-12 h-12"
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        )}
                      </div>
                    )}

                    {/* Active / Inactive badge */}
                    <span
                      className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{
                        background: item.isActive
                          ? "var(--success-soft)"
                          : "var(--bg-overlay)",
                        color: item.isActive
                          ? "var(--success)"
                          : "var(--text-tertiary)",
                        border: `1px solid ${
                          item.isActive
                            ? "rgba(52,211,153,0.15)"
                            : "var(--border-subtle)"
                        }`,
                      }}
                    >
                      {item.isActive ? (
                        <>
                          <Eye className="w-3 h-3" /> فعال
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> غیرفعال
                        </>
                      )}
                    </span>

                    {/* Type badge */}
                    <span
                      className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent-text)",
                        border: "1px solid rgba(139,92,246,0.15)",
                      }}
                    >
                      {item.type === "product" ? "محصول" : "خدمت"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-bold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </h3>

                    <p
                      className="font-semibold mt-1"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {Number(item.price).toLocaleString("fa-IR")} تومان
                    </p>

                    {item.type === "product" && item.stockQuantity != null && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        موجودی: {item.stockQuantity.toLocaleString("fa-IR")}
                      </p>
                    )}

                    {item.type === "service" && item.durationMinutes != null && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        مدت: {item.durationMinutes} دقیقه
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent-text)",
                          border: "1px solid rgba(139,92,246,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent-glow)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--accent-soft)";
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                        ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(item)}
                        className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{
                          background: "var(--error-soft)",
                          color: "var(--error)",
                          border: "1px solid rgba(248,113,113,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(248,113,113,0.18)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--error-soft)";
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================= */}
        {/* ADD ITEM FORM                                                  */}
        {/* ============================================================= */}
        <AddItemForm sellerId={profile.id} />
      </div>

      {/* ================================================================= */}
      {/* EDIT PRODUCT MODAL                                                 */}
      {/* ================================================================= */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            key="edit-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditModal();
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow:
                  "0 0 0 1px var(--border-subtle), 0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between p-6"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  ویرایش {editingItem.type === "product" ? "محصول" : "خدمت"}
                </h3>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all duration-200"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    نام
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
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
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    توضیحات
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 resize-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
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
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--accent-soft)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-default)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    آدرس تصویر
                  </label>
                  <input
                    type="url"
                    value={editForm.imageUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--accent-soft)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-default)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Product-specific: stock */}
                {editingItem.type === "product" && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      موجودی انبار
                    </label>
                    <input
                      type="number"
                      value={editForm.stockQuantity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          stockQuantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px var(--accent-soft)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      min="0"
                    />
                  </div>
                )}

                {/* Service-specific: duration */}
                {editingItem.type === "service" && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      مدت زمان (دقیقه)
                    </label>
                    <input
                      type="number"
                      value={editForm.durationMinutes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px var(--accent-soft)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      min="1"
                    />
                  </div>
                )}

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editForm.isActive}
                    onClick={() =>
                      setEditForm({ ...editForm, isActive: !editForm.isActive })
                    }
                    className="relative w-12 h-7 rounded-full transition-colors duration-200"
                    style={{
                      background: editForm.isActive
                        ? "var(--accent)"
                        : "var(--bg-hover)",
                    }}
                  >
                    <span
                      className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-transform duration-200"
                      style={{
                        background: "var(--text-primary)",
                        transform: editForm.isActive
                          ? "translateX(2px)"
                          : "translateX(22px)",
                      }}
                    />
                  </button>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {editForm.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="flex items-center gap-3 p-6"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                  style={{
                    background: isSaving ? "var(--bg-hover)" : "var(--accent)",
                    color: isSaving
                      ? "var(--text-tertiary)"
                      : "#fff",
                    opacity: isSaving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving)
                      e.currentTarget.style.background = "var(--accent-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره تغییرات"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="min-h-[44px] px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                         */}
      {/* ================================================================= */}
      <AnimatePresence>
        {deletingItem && (
          <motion.div
            key="delete-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteDialog();
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-2xl w-full max-w-sm p-6 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow:
                  "0 0 0 1px var(--border-subtle), 0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "var(--error-soft)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                <Trash2
                  className="w-7 h-7"
                  style={{ color: "var(--error)" }}
                />
              </div>

              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                حذف {deletingItem.type === "product" ? "محصول" : "خدمت"}
              </h3>
              <p className="mb-1" style={{ color: "var(--text-secondary)" }}>
                آیا مطمئن هستید که می‌خواهید
              </p>
              <p
                className="font-semibold mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                &laquo;{deletingItem.name}&raquo;
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--text-tertiary)" }}
              >
                را حذف کنید؟ این عملیات قابل بازگشت نیست.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                  style={{
                    background: isDeleting ? "var(--bg-hover)" : "var(--error)",
                    color: isDeleting ? "var(--text-tertiary)" : "#fff",
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting)
                      e.currentTarget.style.background = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting)
                      e.currentTarget.style.background = "var(--error)";
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال حذف...
                    </>
                  ) : (
                    "بله، حذف کن"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  className="min-h-[44px] flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
