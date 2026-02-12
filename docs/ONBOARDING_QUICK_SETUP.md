# 🚀 Onboarding Flow - Quick Setup

## ⚡ 1-Minute Setup

### Step 1: Run SQL Migration

Go to **Supabase SQL Editor** and run:

```sql
ALTER TABLE "profiles" ADD COLUMN "shop_name" varchar(100);
ALTER TABLE "profiles" ADD COLUMN "shop_slug" varchar(50);
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_shop_slug_unique" UNIQUE("shop_slug");
```

### Step 2: Test It!

1. **Sign up** a new user at `/login`
2. You'll be redirected to `/onboarding` 🎉
3. **Fill the form:**
   - Shop Name: "تست"
   - Instagram: "test_shop" (auto-fills slug)
   - See URL preview: `jat.ir/test_shop`
4. **Click** "شروع کنیم! 🚀"
5. **Redirected** to `/dashboard/import`
6. **Posts auto-load** if Instagram username was provided!

### Step 3: (Optional) Update Existing Users

If you have existing users who need to complete onboarding:

```sql
-- Set all existing users to need onboarding
UPDATE profiles 
SET onboarding_completed = false 
WHERE onboarding_completed IS NULL;

-- Or mark all as completed (skip onboarding)
UPDATE profiles 
SET onboarding_completed = true,
    shop_slug = username
WHERE onboarding_completed IS NULL;
```

---

## ✨ What Happens Now

### New User Experience:
```
Sign Up → Onboarding → Dashboard
```

### Existing User:
- If `onboarding_completed = false`: Redirect to onboarding
- If `onboarding_completed = true`: Normal dashboard access

### Features:
- ✅ Beautiful onboarding UI
- ✅ Auto-fill slug from Instagram
- ✅ Real-time slug validation
- ✅ URL preview
- ✅ Smart redirects
- ✅ Middleware protection
- ✅ Seamless Instagram integration

---

**That's it!** 🎊

Your onboarding flow is ready. New users will now set up their shop before accessing the dashboard!
