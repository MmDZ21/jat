# 🎯 Onboarding Flow - Complete!

## ✨ What's New

New users now get a beautiful onboarding experience after signup that collects essential shop information before accessing the dashboard.

## 🚀 Features Implemented

### 1. **Shop Setup Form** 🏪
- **Shop Name**: Display name for the shop (e.g., "فروشگاه شیک")
- **Instagram Username**: Auto-import products (optional)
- **Shop Slug**: Unique URL identifier (auto-generated from Instagram username)

### 2. **Auto-Fill Slug** ✨
- Type Instagram username → Slug auto-fills
- Example: `shik_shop` → `jat.ir/shik_shop`
- Real-time conversion to valid format

### 3. **Slug Validation** ✅
- **Real-time availability check**
- Shows status:
  - ✓ Green checkmark: Available
  - ✗ Red X: Taken
  - ⟳ Loading spinner: Checking
- Validates format (lowercase, alphanumeric, underscores, hyphens)
- Minimum 3 characters

### 4. **Beautiful UI** 🎨
- Gradient background
- Animated card entrance
- Icon badges
- Live URL preview
- Smooth transitions

### 5. **Smart Redirects** 🔄
- After signup → `/onboarding`
- After onboarding → `/dashboard/import` (posts auto-load!)
- If already completed → Skip to `/dashboard`
- If not completed → Redirect from `/dashboard` to `/onboarding`

## 📦 Database Changes

### New Columns in `profiles` Table:

```sql
ALTER TABLE "profiles" ADD COLUMN "shop_name" varchar(100);
ALTER TABLE "profiles" ADD COLUMN "shop_slug" varchar(50);
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_shop_slug_unique" UNIQUE("shop_slug");
```

## 📁 Files Created/Modified

### New Files:

1. **`src/app/onboarding/page.tsx`**
   - Server component
   - Checks authentication
   - Redirects if already completed

2. **`src/app/onboarding/OnboardingClient.tsx`**
   - Client component with form
   - Auto-fill slug logic
   - Real-time validation
   - Submit handler

3. **`src/app/actions/onboarding.ts`**
   - `checkSlugAvailability()`: Check if slug is taken
   - `completeOnboarding()`: Save shop data
   - `skipOnboarding()`: Optional skip function

4. **Migration: `drizzle/0004_hard_purple_man.sql`**
   - Database schema changes

### Modified Files:

5. **`src/db/schema.ts`**
   - Added `shopName`, `shopSlug`, `onboardingCompleted` fields

6. **`src/app/actions/auth.ts`**
   - Changed signup redirect: `/dashboard` → `/onboarding`

7. **`src/lib/supabase/middleware.ts`**
   - Added onboarding status checks
   - Redirect logic for incomplete onboarding
   - Prevent access to dashboard without onboarding

## 🎯 User Flow

```
┌─────────────────────────────────────────────┐
│  Step 1: User Signs Up                      │
├─────────────────────────────────────────────┤
│  1. Go to /login                            │
│  2. Fill signup form                        │
│  3. Click "ثبت‌نام"                         │
│  4. → Redirect to /onboarding               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Step 2: Onboarding                         │
├─────────────────────────────────────────────┤
│  1. See welcome screen: "به JAT خوش آمدید!"│
│  2. Enter shop name                         │
│  3. Enter Instagram username (optional)     │
│  4. Slug auto-fills from Instagram username │
│  5. See URL preview: jat.ir/shik_shop      │
│  6. System checks slug availability         │
│  7. Click "شروع کنیم! 🚀"                    │
│  8. → Redirect to /dashboard/import         │
│  9. Posts auto-load if Instagram provided!  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Step 3: Return Visit                       │
├─────────────────────────────────────────────┤
│  1. User logs in                            │
│  2. Middleware checks onboardingCompleted   │
│  3. If true → /dashboard                    │
│  4. If false → /onboarding                  │
└─────────────────────────────────────────────┘
```

## 🎨 Onboarding UI

### Header
- Animated purple-pink gradient badge with sparkles icon
- "به JAT خوش آمدید! 🎉" heading
- "بیایید فروشگاه آنلاین شما را راه‌اندازی کنیم" subheading

### Form Fields

#### 1. Shop Name
- **Label**: 🏪 نام فروشگاه
- **Placeholder**: مثلاً: فروشگاه شیک
- **Help text**: این نام در صفحه فروشگاه شما نمایش داده می‌شود
- **Required**: Yes

#### 2. Instagram Username
- **Label**: 📷 نام کاربری اینستاگرام (اختیاری)
- **Placeholder**: username
- **Help text**: برای ایمپورت خودکار محصولات از اینستاگرام
- **Required**: No

#### 3. Shop Slug
- **Label**: ➡️ آدرس فروشگاه شما
- **Placeholder**: shop_name
- **Auto-fills**: From Instagram username
- **Format**: LTR, right-aligned
- **Status icon**: Checking/Available/Taken
- **URL Preview**: Shows full URL in gray box

### Submit Button
- Purple-pink gradient
- "✨ شروع کنیم! 🚀" text
- Disabled when:
  - Form is submitting
  - Slug is not available
  - Required fields empty

## 💻 Code Examples

### Check Slug Availability
```typescript
const result = await checkSlugAvailability("shik_shop");
// { available: true } or
// { available: false, message: "این آدرس قبلاً استفاده شده است" }
```

### Complete Onboarding
```typescript
const result = await completeOnboarding({
  shopName: "فروشگاه شیک",
  shopSlug: "shik_shop",
  instagramUsername: "shik_shop", // optional
});
// { success: true } or { success: false, error: "..." }
```

### Auto-Fill Logic
```typescript
useEffect(() => {
  if (instagramUsername.trim()) {
    const slug = instagramUsername
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 50);
    setShopSlug(slug);
  }
}, [instagramUsername]);
```

### Real-Time Validation
```typescript
useEffect(() => {
  if (!shopSlug.trim()) return;

  const debounceTimer = setTimeout(async () => {
    setIsCheckingSlug(true);
    const result = await checkSlugAvailability(shopSlug);
    setSlugAvailable(result.available);
    setSlugMessage(result.message || "");
    setIsCheckingSlug(false);
  }, 500);

  return () => clearTimeout(debounceTimer);
}, [shopSlug]);
```

## 🔒 Middleware Protection

### Rules:
1. **Unauthenticated users**: Can't access `/dashboard` or `/onboarding`
2. **Authenticated + Not completed**: Can't access `/dashboard`, redirected to `/onboarding`
3. **Authenticated + Completed**: Can't access `/onboarding`, redirected to `/dashboard`

### Implementation:
```typescript
if (profile && !profile.onboardingCompleted && isDashboardRoute) {
  return NextResponse.redirect("/onboarding");
}

if (profile && profile.onboardingCompleted && isOnboardingRoute) {
  return NextResponse.redirect("/dashboard");
}
```

## 🎯 Validation Rules

### Slug Format:
- **Allowed**: `a-z`, `0-9`, `_`, `-`
- **Min length**: 3 characters
- **Max length**: 50 characters
- **Unique**: Must not exist in database

### Shop Name:
- **Required**: Yes
- **Trimmed**: Whitespace removed
- **Max length**: 100 characters (database constraint)

### Instagram Username:
- **Required**: No (optional)
- **Auto-fills slug**: Yes
- **Saves to profile**: Yes (for auto-import feature)

## ✅ Benefits

1. **Better UX**: Collect essential info upfront
2. **Unique URLs**: Each shop has a memorable, unique slug
3. **Instagram Integration**: Seamless product import setup
4. **Professional**: Modern onboarding flow like top SaaS apps
5. **Prevents Issues**: Can't access dashboard without setup

## 🧪 Testing

### Test Flow 1: New User
1. Sign up at `/login`
2. Should redirect to `/onboarding`
3. Fill form:
   - Shop Name: "تست"
   - Instagram: "test_shop"
   - Slug auto-fills: "test_shop"
   - Check if available ✓
4. Click "شروع کنیم!"
5. Should redirect to `/dashboard/import`
6. If Instagram provided, posts should auto-load

### Test Flow 2: Return User (Not Completed)
1. Sign up but close browser before onboarding
2. Login again
3. Try to access `/dashboard`
4. Should redirect to `/onboarding`

### Test Flow 3: Completed User
1. Complete onboarding
2. Try to access `/onboarding`
3. Should redirect to `/dashboard`

### Test Flow 4: Slug Validation
1. Type Instagram: "test_shop"
2. Slug auto-fills: "test_shop"
3. Wait 500ms
4. Should show ✓ if available or ✗ if taken
5. Try invalid chars: "TEST@SHOP"
6. Should auto-convert to: "testshop"

## 📝 SQL Migration

Run this in Supabase SQL Editor:

```sql
ALTER TABLE "profiles" ADD COLUMN "shop_name" varchar(100);
ALTER TABLE "profiles" ADD COLUMN "shop_slug" varchar(50);
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_shop_slug_unique" UNIQUE("shop_slug");
```

## 🎊 Complete Flow Recap

```
User Signs Up
    ↓
Redirect to /onboarding
    ↓
Fill Shop Info
  • Shop Name
  • Instagram Username (optional, auto-fills slug)
  • Shop Slug (validated in real-time)
    ↓
Click "شروع کنیم! 🚀"
    ↓
Save to Database
  • shop_name
  • shop_slug (unique)
  • instagram_username
  • onboarding_completed = true
    ↓
Redirect to /dashboard/import
    ↓
If Instagram provided:
  • Posts auto-load 🎉
  • Welcome banner shows
  • Grid fills with posts
    ↓
User starts selling! 🚀
```

---

**Status:** ✅ **Complete & Ready!**

**Next Steps:**
1. Run SQL migration in Supabase
2. Test signup → onboarding → dashboard flow
3. Verify slug validation works
4. Check middleware redirects

The onboarding experience is fully implemented and creates a professional first impression! 🎯
