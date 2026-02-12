# Authentication Setup Guide

This guide explains how to set up and use Supabase Authentication in the JAT platform.

## 🔐 Overview

We use Supabase Auth for user authentication with the following features:
- Email/Password authentication
- Protected dashboard routes
- Automatic profile creation on signup
- Session management via middleware

## 📋 Setup Instructions

### 1. Get Supabase Credentials

1. Go to your Supabase project: https://app.supabase.com/project/cunyrukxlqqilrjburow
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cunyrukxlqqilrjburow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3. Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers** in Supabase
2. Make sure **Email** provider is enabled
3. Configure email templates if needed

## 🚀 How It Works

### Authentication Flow

```
┌─────────────┐
│   /login    │ ← User lands here if not authenticated
└──────┬──────┘
       │
       ├─→ Sign Up: Creates Supabase user + Profile in DB
       │
       └─→ Login: Authenticates existing user
              │
              ↓
       ┌──────────────┐
       │  /dashboard  │ ← Protected route (requires auth)
       └──────────────┘
```

### Middleware Protection

The middleware (`src/middleware.ts`) automatically:
- Checks if user is authenticated
- Refreshes sessions
- Redirects unauthenticated users from `/dashboard/*` to `/login`

### Profile Creation

When a user signs up:
1. Supabase creates an auth user
2. Our `signup()` action creates a profile in `profiles` table
3. The profile includes:
   - `userId` (linked to Supabase auth)
   - `username` (unique, used in URLs)
   - `displayName`
   - `email`

## 📁 File Structure

```
src/
├── lib/supabase/
│   ├── client.ts         # Client-side Supabase client
│   ├── server.ts         # Server-side Supabase client
│   └── middleware.ts     # Session refresh logic
├── app/
│   ├── actions/
│   │   └── auth.ts       # Auth actions (login, signup, logout)
│   ├── login/
│   │   ├── page.tsx      # Login page
│   │   └── LoginForm.tsx # Login/signup form
│   └── dashboard/
│       └── ...           # Protected dashboard pages
└── middleware.ts         # Next.js middleware (route protection)
```

## 🔧 Available Actions

### `login(formData: FormData)`
Authenticates a user with email/password.

### `signup(formData: FormData)`
Creates a new user and profile:
- Email
- Password
- Username (unique)
- Display Name

### `logout()`
Signs out the current user and redirects to `/login`.

### `getCurrentUser()`
Returns the current authenticated Supabase user.

### `getCurrentUserProfile()`
Returns the current user's profile from the `profiles` table.

## 🎯 Usage Examples

### Protecting a Page

```tsx
import { getCurrentUserProfile } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function MyProtectedPage() {
  const profile = await getCurrentUserProfile();
  
  if (!profile) {
    redirect("/login");
  }
  
  return <div>Welcome, {profile.displayName}!</div>;
}
```

### Logout Button

```tsx
import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit">Logout</button>
    </form>
  );
}
```

### Getting Current User in Server Action

```tsx
"use server";

import { getCurrentUserProfile } from "@/app/actions/auth";

export async function myServerAction() {
  const profile = await getCurrentUserProfile();
  
  if (!profile) {
    return { error: "Not authenticated" };
  }
  
  // Use profile.id as sellerId
  await db.insert(items).values({
    sellerId: profile.id,
    // ...
  });
}
```

## 🔒 Security Notes

1. **Never commit `.env` file** - Use `.env.example` for templates
2. **anon key is safe for client-side** - Row Level Security (RLS) protects data
3. **Middleware runs on every request** - Sessions are automatically refreshed
4. **Profile creation uses transaction** - Prevents orphaned auth users

## 🐛 Troubleshooting

### "User not authenticated" error
- Check that environment variables are set correctly
- Verify Supabase Email provider is enabled
- Clear cookies and try logging in again

### Profile not found after signup
- Check database for successful profile creation
- Look at server logs for any errors during signup
- Ensure `profiles` table has correct foreign key setup

### Redirect loop
- Make sure `/login` route is excluded from middleware protection
- Check middleware matcher in `src/middleware.ts`

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
