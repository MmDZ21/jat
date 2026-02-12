# Quick Database Migration - Instagram Username

## 🎯 What This Adds

A new `instagram_username` field to the `profiles` table to enable:
- Auto-loading Instagram posts on page entry
- Pre-filled username input
- "Welcome back" message
- Save username for future visits

## 📝 SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE "profiles" ADD COLUMN "instagram_username" varchar(50);
```

## ✅ How to Apply

1. **Go to:** https://supabase.com/dashboard
2. **Navigate to:** Your project → SQL Editor
3. **Paste** the SQL above
4. **Click:** Run

That's it! The feature is ready to use.

## 🎨 Features Added

### 1. Auto-Fetch Posts
- If user has saved Instagram username → Posts load automatically on page entry
- No need to type and click "Fetch" every time

### 2. Welcome Banner
Shows when returning with saved username:
```
👋 خوش آمدید!
پست‌های @username را بارگذاری کردیم
```

### 3. Save Prompt
After fetching posts with a new username:
```
می‌خواهید این حساب را ذخیره کنید؟
با ذخیره @username، دفعه بعد خودکار پست‌ها بارگذاری می‌شوند
[بعداً] [ذخیره]
```

### 4. Smart UX
- Pre-fills input with saved username
- Only shows save prompt if username is different
- Auto-fetches in background on first visit
- Smooth animations with framer-motion

## 🔧 Files Changed

1. **`src/db/schema.ts`**
   - Added `instagramUsername` field to profiles table

2. **`src/app/actions/auth.ts`**
   - Added `updateInstagramUsername()` server action

3. **`src/app/dashboard/import/page.tsx`**
   - Pass `savedInstagramUsername` prop to client

4. **`src/app/dashboard/import/InstagramImportClient.tsx`**
   - Accept `savedInstagramUsername` prop
   - Auto-fetch on mount if username exists
   - Show welcome banner
   - Show save prompt after successful fetch
   - Handle save/dismiss actions

## 🧪 Test Flow

1. **First Visit (No Saved Username):**
   - User enters username → Fetches posts
   - Save prompt appears: "می‌خواهید این حساب را ذخیره کنید?"
   - User clicks "ذخیره" → Username saved to database

2. **Return Visit (Has Saved Username):**
   - Welcome banner shows: "خوش آمدید! 👋 پست‌های @username را بارگذاری کردیم"
   - Input pre-filled with username
   - Posts auto-fetch in background
   - Grid loads automatically!

3. **Change Username:**
   - User types new username → Fetches posts
   - Save prompt appears again
   - Can save new username or dismiss

## ✅ Status

- ✅ Database schema updated
- ✅ Migration SQL generated
- ✅ Server actions created
- ✅ Client component updated
- ✅ UX flow implemented
- ✅ Animations added
- ⏳ **Pending:** Run SQL migration in Supabase

**Ready to test after running the SQL!** 🚀
