"use client";

import { useState, useEffect } from "react";
import { iranYekan } from "@/app/fonts";
import { ArrowLeft, Instagram, Loader2, Check, FileText, Sparkles, RefreshCw, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { saveImportedProducts } from "@/app/actions/instagram-import";
import { getInstagramPosts } from "@/app/actions/instagram";
import { updateInstagramUsername } from "@/app/actions/auth";
import ImportSuccessModal from "@/components/ImportSuccessModal";
import { useRouter } from "next/navigation";

interface InstagramPost {
  id: string;
  mediaUrl: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  permalink: string;
  thumbnailUrl?: string;
}

interface ProductData {
  instagramPostId: string;
  name: string;
  price: string;
  stock: number;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

type Step = "select" | "workbench";

interface InstagramImportClientProps {
  savedInstagramUsername: string | null;
  shopSlug: string;
}

export default function InstagramImportClient({ savedInstagramUsername, shopSlug }: InstagramImportClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [username, setUsername] = useState(savedInstagramUsername || "");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Workbench state
  const [productData, setProductData] = useState<Record<string, ProductData>>({});
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState("");

  const POSTS_PER_PAGE = 12;

  // Auto-fetch posts if saved username exists
  useEffect(() => {
    if (savedInstagramUsername && !hasAutoFetched) {
      setHasAutoFetched(true);
      handleFetchPosts();
    }
  }, [savedInstagramUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFetchPosts = async () => {
    if (!username.trim()) {
      setError("لطفاً نام کاربری اینستاگرام را وارد کنید");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPosts([]);
    setSelectedPosts(new Set());

    try {
      const result = await getInstagramPosts(username, POSTS_PER_PAGE);
      
      if (!result.success || result.posts.length === 0) {
        setError(result.error || "پستی یافت نشد یا نام کاربری اشتباه است");
      } else {
        setPosts(result.posts);
        
        // Show save prompt if username is different from saved one
        if (username !== savedInstagramUsername) {
          setShowSavePrompt(true);
        }
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("خطا در دریافت پست‌ها. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    const result = await updateInstagramUsername(username);
    if (result.success) {
      setShowSavePrompt(false);
    }
  };

  const handleDismissSavePrompt = () => {
    setShowSavePrompt(false);
  };

  const handleRefresh = async () => {
    if (!username.trim()) return;
    await handleFetchPosts();
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleGoToWorkbench = () => {
    // Initialize product data for selected posts
    const initialData: Record<string, ProductData> = {};
    const selectedPostsArray = posts.filter((post) => selectedPosts.has(post.id));

    selectedPostsArray.forEach((post) => {
      initialData[post.id] = {
        instagramPostId: post.id,
        name: `محصول ${post.caption.substring(0, 30)}...`,
        price: "",
        stock: 1,
        description: post.caption,
        imageUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
      };
    });

    setProductData(initialData);
    setStep("workbench");
  };

  const handleBackToSelect = () => {
    setStep("select");
  };

  const updateProductField = (
    postId: string,
    field: keyof ProductData,
    value: string | number
  ) => {
    setProductData((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [field]: value,
      },
    }));
  };

  const handleApplyStockToAll = () => {
    const stock = prompt("موجودی برای همه محصولات:");
    if (stock && !isNaN(Number(stock))) {
      setProductData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key].stock = Number(stock);
        });
        return updated;
      });
    }
  };

  const openDescriptionModal = (postId: string) => {
    setEditingDescriptionId(postId);
    setTempDescription(productData[postId]?.description || "");
  };

  const saveDescription = () => {
    if (editingDescriptionId) {
      updateProductField(editingDescriptionId, "description", tempDescription);
      setEditingDescriptionId(null);
      setTempDescription("");
    }
  };

  const isFormValid = () => {
    return Object.values(productData).every(
      (product) => product.name.trim() !== "" && product.price.trim() !== "" && Number(product.price) > 0
    );
  };

  const handleFinalSync = async () => {
    if (!isFormValid()) {
      alert("لطفاً نام و قیمت همه محصولات را وارد کنید");
      return;
    }

    setIsSaving(true);

    try {
      const productsToImport = Object.values(productData);
      const result = await saveImportedProducts(productsToImport);

      if (result.success) {
        // Success! Show celebration modal
        setImportedCount(result.importedCount || 0);
        setShowSuccessModal(true);
      } else {
        alert(result.error || "خطا در ذخیره محصولات");
      }
    } catch (err) {
      console.error("Error saving products:", err);
      alert("خطا در ذخیره محصولات");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Redirect to dashboard after modal closes
    router.push("/dashboard");
  };

  return (
    <div
      className={`min-h-screen py-8 px-4 pb-32 ${iranYekan.variable} font-sans`}
      style={{
        fontFamily: "var(--font-iran-yekan)",
        backgroundColor: '#09090B',
        '--bg-base': '#09090B',
        '--bg-surface': '#111114',
        '--bg-elevated': '#18181C',
        '--bg-overlay': '#1F1F25',
        '--bg-hover': '#26262E',
        '--bg-input': '#141418',
        '--border-subtle': 'rgba(255,255,255,0.06)',
        '--border-default': 'rgba(255,255,255,0.08)',
        '--border-strong': 'rgba(255,255,255,0.12)',
        '--text-primary': '#EDEDF0',
        '--text-secondary': '#8B8B9E',
        '--text-tertiary': '#5C5C70',
        '--accent': '#8B5CF6',
        '--accent-hover': '#7C3AED',
        '--accent-soft': 'rgba(139,92,246,0.12)',
        '--accent-glow': 'rgba(139,92,246,0.20)',
        '--accent-text': '#A78BFA',
        '--success': '#34D399',
        '--success-soft': 'rgba(52,211,153,0.12)',
        '--error': '#F87171',
        '--error-soft': 'rgba(248,113,113,0.12)',
        '--shadow-card': '0 2px 8px rgba(0,0,0,0.3)',
        '--shadow-lg': '0 8px 32px rgba(0,0,0,0.4)',
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto">
        {/* Step 1: Select Posts */}
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 font-medium transition-colors mb-4"
                  style={{ color: 'var(--accent-text)' }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  بازگشت به داشبورد
                </Link>
                
                {/* Welcome Back Banner */}
                {savedInstagramUsername && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 mb-4"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-hover))' }}
                      >
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          خوش آمدید! 👋
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          پست‌های @{savedInstagramUsername} را بارگذاری کردیم
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex items-center gap-3 mb-2">
                  <Instagram className="w-8 h-8" style={{ color: 'var(--accent-text)' }} />
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ایمپورت از اینستاگرام
                  </h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  پست‌های اینستاگرام خود را انتخاب و به فروشگاه اضافه کنید
                </p>
              </div>

              {/* Save Username Prompt */}
              <AnimatePresence>
                {showSavePrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="rounded-xl p-4 mb-6 overflow-hidden"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <BookmarkCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-text)' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            می‌خواهید این حساب را ذخیره کنید؟
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            با ذخیره @{username}، دفعه بعد خودکار پست‌ها بارگذاری می‌شوند
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleDismissSavePrompt}
                          className="px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          بعداً
                        </button>
                        <button
                          onClick={handleSaveUsername}
                          className="px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          ذخیره
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username Input */}
              <div
                className="rounded-2xl p-6 mb-8"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="instagram-username"
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      نام کاربری اینستاگرام
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="instagram-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFetchPosts()}
                        placeholder="username"
                        className="w-full px-4 py-3 pr-12 rounded-lg outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                        disabled={isLoading}
                      />
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                  <div className="sm:self-end flex gap-2">
                    <button
                      onClick={handleFetchPosts}
                      disabled={isLoading || !username.trim()}
                      className="flex-1 sm:flex-initial px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                      style={{
                        background: (isLoading || !username.trim())
                          ? 'linear-gradient(to right, #5C5C70, #5C5C70)'
                          : 'linear-gradient(to right, var(--accent), var(--accent-hover))',
                        opacity: (isLoading || !username.trim()) ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          در حال دریافت...
                        </>
                      ) : (
                        <>
                          <Instagram className="w-5 h-5" />
                          دریافت پست‌ها
                        </>
                      )}
                    </button>
                    {posts.length > 0 && !isLoading && (
                      <button
                        onClick={handleRefresh}
                        className="px-4 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                        }}
                        title="تازه‌سازی پست‌ها"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div
                    className="mt-4 p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--error-soft)',
                      border: '1px solid rgba(248,113,113,0.2)',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
                  </div>
                )}
              </div>

              {/* Posts Grid */}
              {posts.length > 0 && (
                <>
                  <div className="mb-6">
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {posts.length} پست یافت شد
                      {selectedPosts.size > 0 && (
                        <span style={{ color: 'var(--accent-text)' }}>
                          {" "}
                          • {selectedPosts.size} پست انتخاب شده
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {posts.map((post) => {
                      const isSelected = selectedPosts.has(post.id);
                      return (
                        <div
                          key={post.id}
                          onClick={() => togglePostSelection(post.id)}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                          style={{
                            outline: isSelected ? '3px solid var(--accent)' : 'none',
                            outlineOffset: '-3px',
                            boxShadow: isSelected ? '0 0 20px rgba(139,92,246,0.3)' : 'none',
                            transform: isSelected ? 'scale(0.95)' : undefined,
                          }}
                        >
                          <Image
                            src={post.thumbnailUrl || post.mediaUrl}
                            alt={post.caption}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                            unoptimized
                          />
                          
                          {isSelected && (
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(139,92,246,0.3)' }}
                            >
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: 'var(--accent)' }}
                              >
                                <Check className="w-7 h-7 text-white" strokeWidth={3} />
                              </div>
                            </div>
                          )}

                          {post.mediaType !== "IMAGE" && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 rounded text-white text-xs">
                              {post.mediaType === "VIDEO" ? "📹" : "🖼️"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center py-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    💡 برای صرفه‌جویی در API requests، قابلیت بارگذاری بیشتر غیرفعال است
                  </div>
                </>
              )}

              {!isLoading && posts.length === 0 && !error && (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <Instagram className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    آماده برای شروع؟
                  </h2>
                  <p style={{ color: 'var(--text-tertiary)' }}>
                    نام کاربری اینستاگرام خود را وارد کنید تا پست‌ها را مشاهده کنید
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Workbench */}
          {step === "workbench" && (
            <motion.div
              key="workbench"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={handleBackToSelect}
                  className="inline-flex items-center gap-2 font-medium transition-colors mb-4"
                  style={{ color: 'var(--accent-text)' }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  بازگشت به انتخاب پست‌ها
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-8 h-8" style={{ color: 'var(--accent-text)' }} />
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ویرایش دسته‌ای
                  </h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  اطلاعات محصولات را تکمیل کنید ({Object.keys(productData).length} محصول)
                </p>
              </div>

              {/* Quick Actions */}
              <div
                className="rounded-2xl p-4 mb-6"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>اقدامات سریع:</span>
                  <button
                    onClick={handleApplyStockToAll}
                    className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    📦 اعمال موجودی به همه
                  </button>
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-4">
                {Object.entries(productData).map(([postId, product], index) => (
                  <div
                    key={postId}
                    className="rounded-2xl p-6 transition-shadow"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="shrink-0 relative w-16 h-16">
                        <Image
                          src={product.thumbnailUrl || product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            نام محصول *
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              updateProductField(postId, "name", e.target.value)
                            }
                            autoFocus={index === 0}
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                            }}
                            placeholder="نام محصول"
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            قیمت (تومان) *
                          </label>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updateProductField(postId, "price", e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                            }}
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            موجودی
                          </label>
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) =>
                              updateProductField(postId, "stock", Number(e.target.value))
                            }
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                            }}
                            placeholder="1"
                            min="0"
                          />
                        </div>

                        {/* Description Button */}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            توضیحات
                          </label>
                          <button
                            onClick={() => openDescriptionModal(postId)}
                            className="w-full px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <FileText className="w-4 h-4" />
                            ویرایش
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Sync Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleFinalSync}
                  disabled={!isFormValid()}
                  className="px-8 py-4 text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-3 text-lg disabled:cursor-not-allowed"
                  style={{
                    background: !isFormValid()
                      ? 'linear-gradient(to right, #5C5C70, #5C5C70)'
                      : 'linear-gradient(to right, #34D399, #10B981)',
                    boxShadow: !isFormValid() ? 'none' : '0 8px 32px rgba(52,211,153,0.3)',
                    opacity: !isFormValid() ? 0.5 : 1,
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                  ذخیره نهایی و ایمپورت
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Bar (Step 1 only) */}
        {step === "select" && selectedPosts.size > 0 && (
          <div
            className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-strong)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <span className="text-white font-bold">
                      {selectedPosts.size}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedPosts.size} پست انتخاب شده
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      برای ادامه روی بعدی کلیک کنید
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGoToWorkbench}
                  className="px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  بعدی
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description Modal */}
      {editingDescriptionId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl max-w-2xl w-full p-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>ویرایش توضیحات</h3>
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg outline-none resize-none focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-[#5C5C70]"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              placeholder="توضیحات محصول را وارد کنید..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setEditingDescriptionId(null);
                  setTempDescription("");
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                لغو
              </button>
              <button
                onClick={saveDescription}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                ذخیره
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full-screen Loading Overlay */}
      {isSaving && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-white"
          >
            <Sparkles className="w-20 h-20 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl font-bold mb-4">جادو در حال انجام است...</h2>
            <p className="text-xl opacity-90 mb-8">
              در حال آپلود و ذخیره محصولات شما
            </p>
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      <ImportSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        importedCount={importedCount}
        shopSlug={shopSlug}
      />

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
