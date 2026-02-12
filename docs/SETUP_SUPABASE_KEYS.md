# 🔑 Quick Setup: Get Your Supabase Keys

Follow these steps to complete the authentication setup:

## Step 1: Go to Supabase Dashboard

Visit: https://app.supabase.com/project/cunyrukxlqqilrjburow/settings/api

## Step 2: Copy Your Keys

You'll see a page with two important values:

### 1. Project URL
```
Example: https://cunyrukxlqqilrjburow.supabase.co
```

### 2. anon public key
```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
⚠️ This will be a very long string (several hundred characters)

## Step 3: Update Your .env File

Open `.env` and replace the placeholder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cunyrukxlqqilrjburow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_actual_key_here
```

## Step 4: Restart Dev Server

After updating `.env`:

```bash
# Stop the dev server (Ctrl+C)
# Start it again
pnpm dev
```

## Step 5: Test Authentication

1. Go to `http://localhost:3000/login`
2. Click "حساب کاربری ندارید؟ ثبت‌نام کنید"
3. Fill in:
   - Username (URL-friendly, e.g., `john_doe`)
   - Display Name (e.g., `John Doe`)
   - Email
   - Password (min 6 characters)
4. Click "ثبت‌نام"
5. You should be redirected to `/dashboard`

## ✅ You're Done!

If you successfully reach the dashboard after signup, authentication is working correctly!

## 🆘 Need Help?

If the anon key page requires you to log in to Supabase:
1. You may need to accept an email invitation
2. Check your email for a Supabase invite link
3. Or contact the project owner for access

---

**Note:** The `anon` (anonymous) key is safe to use in client-side code. It's protected by Row Level Security (RLS) policies in your database.
