# ⚠️ URGENT: Run This SQL Migration!

## 🔴 Error Fix

The runtime error you're seeing is because the new database columns don't exist yet.

## ✅ Solution

### Go to Supabase SQL Editor and run this:

```sql
-- Add new columns for onboarding feature
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "shop_name" varchar(100);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "shop_slug" varchar(50);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "instagram_username" varchar(50);

-- Add unique constraint for shop_slug (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_shop_slug_unique'
    ) THEN
        ALTER TABLE "profiles" ADD CONSTRAINT "profiles_shop_slug_unique" UNIQUE("shop_slug");
    END IF;
END $$;
```

## 📍 Where to Run This

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `cunyrukxlqqilrjburow`
3. **Go to**: SQL Editor (left sidebar)
4. **Paste** the SQL above
5. **Click**: Run

## ⏱️ Takes 5 seconds!

After running, refresh your app - the error will be gone! ✅

---

## 🔧 Optional: Update Existing Users

If you have existing users, mark them as completed to skip onboarding:

```sql
-- Mark all existing users as having completed onboarding
UPDATE profiles 
SET 
  onboarding_completed = true,
  shop_slug = username
WHERE onboarding_completed IS NULL;
```

Or let them go through onboarding:

```sql
-- All users need to complete onboarding
UPDATE profiles 
SET onboarding_completed = false
WHERE onboarding_completed IS NULL;
```

---

**That's it!** Run the first SQL block and your app will work. 🚀
