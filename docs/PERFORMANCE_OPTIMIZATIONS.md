# Performance Optimizations - Complete Guide

## Overview
JAT is built with performance as a top priority. This document outlines all performance optimizations implemented.

## ✅ Implemented Optimizations

### 1. Next.js Image Component

**Replaced:** Standard `<img>` tags
**With:** Next.js `<Image>` component

**Benefits:**
- ✅ Automatic image optimization
- ✅ Lazy loading by default
- ✅ Responsive srcset generation
- ✅ AVIF/WebP format conversion
- ✅ Blur placeholder support
- ✅ Size optimization (up to 80% smaller)

**Implementation:**
```typescript
// Avatar image
<Image
  src={profile.avatarUrl}
  alt={profile.displayName}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 96px, 112px"
  priority  // Above the fold
/>

// Item images
<Image
  src={item.imageUrl}
  alt={item.name}
  fill
  className="object-cover"
  sizes="80px"
/>
```

**Configuration (`next.config.ts`):**
```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**", // Allow all HTTPS images
    },
  ],
  formats: ["image/avif", "image/webp"],
}
```

### 2. Incremental Static Regeneration (ISR)

**What:** Pages are statically generated and revalidated periodically

**Configuration:**
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

**Benefits:**
- ✅ Fast page loads (static HTML)
- ✅ Always fresh content (revalidates)
- ✅ Reduced database load
- ✅ Better SEO (static pages)
- ✅ Lower server costs

**How it works:**
1. First request → Generate static page
2. Subsequent requests → Serve cached static page
3. After 60s → Regenerate in background
4. Next request → Serve updated page

### 3. React Optimizations

**useMemo:** Memoize expensive calculations
```typescript
const currentItems = useMemo(
  () => (activeTab === "products" ? products : services),
  [activeTab, products, services]
);
```

**useCallback:** Memoize functions
```typescript
const formatPrice = useCallback((price: string) => {
  return new Intl.NumberFormat("fa-IR").format(parseFloat(price));
}, []);
```

**Benefits:**
- ✅ Prevents unnecessary re-renders
- ✅ Reduces computation on re-renders
- ✅ Improves animation smoothness

### 4. Database Query Optimization

**Single Query with Relations:**
```typescript
const profile = await db.query.profiles.findFirst({
  where: and(
    eq(profiles.username, username),
    eq(profiles.isPublished, true)
  ),
  with: {
    items: {
      where: eq(items.isActive, true),
      orderBy: (items, { asc }) => [
        asc(items.sortOrder), 
        asc(items.createdAt)
      ],
    },
  },
});
```

**Benefits:**
- ✅ Single database round-trip
- ✅ No N+1 queries
- ✅ Faster page load
- ✅ Reduced database load

### 5. Font Optimization

**Local Fonts:** IRANYekan loaded locally

**Benefits:**
- ✅ No external requests
- ✅ Instant font loading
- ✅ No FOUT (Flash of Unstyled Text)
- ✅ Better privacy (no Google Fonts tracking)

**Configuration:**
```typescript
export const iranYekan = localFont({
  src: [...],
  variable: "--font-iran-yekan",
  display: "swap",
  fallback: ["system-ui", "arial"],
});
```

### 6. Code Splitting

**Client Components:** Separated from server components

**Structure:**
```
page.tsx           → Server Component (RSC)
ProfileClient.tsx  → Client Component (hydrated)
```

**Benefits:**
- ✅ Smaller initial bundle
- ✅ Faster Time to Interactive (TTI)
- ✅ Progressive hydration
- ✅ Better caching

### 7. Loading States

**Suspense Boundaries:** Automatic loading UI

**Implementation:**
```typescript
// app/[username]/loading.tsx
export default function Loading() {
  return <LoadingSpinner />;
}
```

**Benefits:**
- ✅ Instant loading feedback
- ✅ Better perceived performance
- ✅ No layout shift
- ✅ Improved UX

### 8. Metadata Optimization

**Dynamic Open Graph:** Optimized social sharing

```typescript
openGraph: {
  title,
  description,
  type: "profile",
  locale: "fa_IR",
  images: [{ url: avatar, width: 400, height: 400 }],
}
```

**Benefits:**
- ✅ Better social media previews
- ✅ Improved SEO
- ✅ Higher click-through rates

### 9. React Compiler

**Enabled:** Next.js React Compiler

```typescript
// next.config.ts
reactCompiler: true
```

**Benefits:**
- ✅ Automatic memoization
- ✅ Faster re-renders
- ✅ Smaller bundle size
- ✅ Better performance without manual optimization

### 10. Framer Motion Optimization

**AnimatePresence:** Optimized animations

```typescript
<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  />
</AnimatePresence>
```

**Benefits:**
- ✅ GPU-accelerated animations
- ✅ 60fps smooth transitions
- ✅ Minimal layout thrashing
- ✅ Better mobile performance

## 📊 Performance Metrics

### Expected Scores (Lighthouse)

- **Performance:** 95-100
- **Accessibility:** 95-100
- **Best Practices:** 95-100
- **SEO:** 95-100

### Key Web Vitals Targets

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **FID** | < 100ms | First Input Delay |
| **CLS** | < 0.1 | Cumulative Layout Shift |
| **FCP** | < 1.8s | First Contentful Paint |
| **TTI** | < 3.8s | Time to Interactive |

## 🚀 Additional Performance Tips

### 1. Image Best Practices

```typescript
// Priority for above-the-fold images
<Image priority />

// Proper sizes attribute
sizes="(max-width: 768px) 100vw, 50vw"

// Use fill for flexible containers
fill
className="object-cover"
```

### 2. Database Connection Pooling

postgres.js handles this automatically:
```typescript
const client = postgres(DATABASE_URL);
// Automatic connection pooling
// Max 10 connections by default
```

### 3. Server vs Client Components

**Server Components (default):**
- Database queries
- Static content
- Initial page structure

**Client Components ('use client'):**
- Interactivity (click, hover)
- State management
- Animations
- Browser APIs

### 4. Caching Strategy

**Levels:**
1. **Browser Cache** - Static assets (fonts, images)
2. **CDN Cache** - Edge caching (Vercel/Cloudflare)
3. **ISR Cache** - Next.js page cache (60s)
4. **Database** - Query results if needed

### 5. Bundle Size Optimization

**Current Dependencies:**
- ✅ Tree-shaking enabled
- ✅ Minimal dependencies
- ✅ No moment.js (heavy)
- ✅ Framer Motion (tree-shakeable)

**Avoid:**
- ❌ lodash (use lodash-es or native methods)
- ❌ moment.js (use native Intl)
- ❌ jQuery (use vanilla JS)

## 🔧 Performance Monitoring

### Development

```bash
# Check bundle size
pnpm build

# Analyze bundle
npm install -g @next/bundle-analyzer
```

### Production

**Vercel Analytics:**
- Real User Monitoring (RUM)
- Web Vitals tracking
- Performance insights

**Custom Monitoring:**
```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 📱 Mobile Performance

**Optimizations:**
- ✅ Touch-friendly targets (48x48px)
- ✅ Reduced animations on low-end devices
- ✅ Smaller image sizes for mobile
- ✅ Critical CSS inlined
- ✅ Lazy loading below fold

**Test on:**
- iPhone SE (375px)
- Android (360px)
- Slow 3G network

## 🎯 Performance Checklist

Before deploying:

- [ ] Images use Next.js Image component
- [ ] Fonts are locally hosted
- [ ] ISR is configured (revalidate)
- [ ] Loading states implemented
- [ ] Metadata is complete
- [ ] Database queries optimized
- [ ] Bundle size is reasonable (< 200KB JS)
- [ ] Lighthouse score > 90
- [ ] Tested on mobile
- [ ] Tested on slow connection

## 🔄 Continuous Optimization

**Monthly:**
- [ ] Review bundle size
- [ ] Check Core Web Vitals
- [ ] Update dependencies
- [ ] Profile performance
- [ ] Review Lighthouse scores

**On Changes:**
- [ ] Test performance impact
- [ ] Compare before/after metrics
- [ ] Check mobile performance
- [ ] Verify image optimization

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image)
