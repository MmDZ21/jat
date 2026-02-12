# 🎯 START HERE: Complete Authentication in 4 Steps

## Step 1️⃣: Get Your Supabase Anon Key (2 minutes)

1. **Open this link** in your browser:
   ```
   https://app.supabase.com/project/cunyrukxlqqilrjburow/settings/api
   ```

2. **Find the "anon public" key** (it's a very long string starting with `eyJ...`)

3. **Copy the entire key** (click the copy button)

## Step 2️⃣: Set Up Database Trigger (3 minutes)

1. **Go to Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/cunyrukxlqqilrjburow/editor
   ```

2. **Copy the SQL** from `docs/supabase-trigger.sql`

3. **Run the SQL** (click "Run" button)

4. **Verify success** - Should see "Success. No rows returned"

This trigger automatically creates a profile when users sign up!

## Step 3️⃣: Update Your .env File (1 minute)

1. Open `.env` in your project root

2. Replace this line:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   
   With:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... [paste your key here]
   ```

3. Save the file

## Step 4️⃣: Restart and Test (2 minutes)

1. **Stop your dev server** (press `Ctrl+C` in terminal)

2. **Start it again:**
   ```bash
   pnpm dev
   ```

3. **Test the login flow:**
   - Go to: `http://localhost:3000/login`
   - Click "حساب کاربری ندارید؟ ثبت‌نام کنید"
   - Fill in the form:
     - Username: `testuser`
     - Display Name: `Test User`
     - Email: `test@example.com`
     - Password: `password123`
   - Click "ثبت‌نام"
   - Should redirect to `/dashboard` ✅

## 🎉 Done!

If you reached the dashboard after signup, authentication is fully working!

---

## 🔍 What Changed?

### ✅ Before (without auth):
```
Anyone could access /dashboard
Used hardcoded sellerId
No user accounts
```

### ✅ Now (with auth):
```
Must log in to access /dashboard
Each user has their own profile
Sellers can only see their own orders/items
Logout button available
```

---

## 🚀 Quick Test Checklist

- [ ] Can access `/login` without being logged in
- [ ] Can create a new account (signup)
- [ ] Redirects to `/dashboard` after signup
- [ ] Dashboard shows my display name
- [ ] Can see logout button
- [ ] Clicking logout redirects to `/login`
- [ ] Trying to access `/dashboard` when logged out redirects to `/login`

---

## 📖 Need More Info?

- **Full Documentation:** `docs/AUTHENTICATION.md`
- **Implementation Details:** `docs/AUTHENTICATION_IMPLEMENTATION.md`
- **Troubleshooting:** See the troubleshooting section in either doc

---

## 🆘 Common Issues

### "Invalid API credentials"
→ Make sure you copied the **entire** anon key (it's very long!)

### Can't access the Supabase API page
→ You may need to be invited to the project. Check your email or contact the project owner.

### Redirect loop on dashboard
→ Clear your browser cookies and try again

### Page shows error after signup
→ Check the terminal for error messages. The database might not be running.

---

**That's it!** You now have full authentication working. Happy coding! 🎊
