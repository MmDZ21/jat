# Add Item Form - Usage Guide

## Overview
A complete form component for adding products or services to the JAT platform with Persian (Farsi) UI, RTL layout, and full validation.

## Files Created

### 1. `/src/db/index.ts`
Database connection using Drizzle ORM with `postgres` (postgres.js) - a fast, modern PostgreSQL client.

### 2. `/src/lib/validations/item.ts`
Zod schema for validating item data with Persian error messages.

### 3. `/src/app/actions/items.ts`
Server Action for creating items in the database.

### 4. `/src/components/AddItemForm.tsx`
Client Component with the full form UI.

### 5. `/src/app/dashboard/page.tsx`
Example usage page.

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Push Schema to Database
```bash
pnpm exec drizzle-kit push
```

### 3. Run Development Server
```bash
pnpm dev
```

### 4. Visit the Form
Navigate to `http://localhost:3000/dashboard`

## Features

✅ **Toggle between Product and Service**
- Clean toggle button UI
- Conditional fields based on selection

✅ **Product Fields**
- Name, Description, Price
- Stock Quantity (required)
- Is Digital checkbox
- Image URL

✅ **Service Fields**
- Name, Description, Price
- Duration in Minutes (required)
- Image URL

✅ **Validation**
- Zod schema with Persian error messages
- Client-side and server-side validation
- Clear error feedback

✅ **Persian (Farsi) UI**
- All labels and messages in Persian
- RTL layout
- Persian-friendly styling

✅ **Mobile-First Design**
- Fully responsive
- Touch-friendly inputs
- Clean, Apple-like aesthetic

✅ **Server Actions**
- Type-safe database operations
- Automatic revalidation
- Error handling

## Usage in Your App

Replace the `sellerId` in `dashboard/page.tsx` with the actual user ID from your auth system:

```tsx
import { auth } from "@/lib/auth"; // Your auth setup
import AddItemForm from "@/components/AddItemForm";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AddItemForm sellerId={session.user.id} />
    </div>
  );
}
```

## Customization

### Change Currency
Edit `src/app/actions/items.ts` line 22:
```ts
currency: "USD", // Change from "IRT"
```

### Add More Fields
1. Update the Zod schema in `/src/lib/validations/item.ts`
2. Add the input field in `/src/components/AddItemForm.tsx`
3. Update the database schema if needed

### Change Success Behavior
Modify the success handler in `AddItemForm.tsx` line 67:
```tsx
if (result.success) {
  router.push(`/items/${result.itemId}`); // Redirect instead of reset
}
```

## Notes

- The form uses **Lucide React** icons
- Styling is done with **Tailwind CSS**
- All database operations use **Drizzle ORM**
- Error messages are in **Persian**
- Currency is set to **IRT (Iranian Toman)**
