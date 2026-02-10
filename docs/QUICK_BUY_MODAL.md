# Quick Buy Modal - Documentation

## Overview
A complete quick buy/order system with modal UI, form validation, and Server Actions for instant purchases from the public profile page.

## Files Created

### 1. `/src/app/actions/orders.ts`
Server Action for creating orders:
- Validates customer information
- Generates unique order number (JAT-YYYYMMDD-XXXX)
- Calculates platform fee (10%)
- Creates order + order item in transaction
- Sets status to `awaiting_approval`
- Returns order number

### 2. `/src/components/QuickBuyModal.tsx`
Modal component with:
- Item display with image and details
- Customer name input
- Phone number input
- Submit button using theme color
- Success state with order number
- Error handling
- Loading states

### 3. Updated `/src/app/[username]/ProfileClient.tsx`
- Added modal state management
- Item click handler
- Modal integration
- Theme color passed to modal
- Hover effect shows theme border

## Features

### 🛒 Quick Order Flow

1. **User clicks item** → Modal opens
2. **Item details shown** → Name, price, description, image
3. **User fills form** → Name and phone number
4. **Clicks "ثبت سفارش"** → Server Action creates order
5. **Success message** → Shows order number
6. **Modal closes** → User returns to profile

### 📋 Order Details

**Status:** `awaiting_approval` (seller needs to approve)
**Payment:** `pending` (will be handled later)

**Financial Breakdown:**
```typescript
Subtotal: item.price
Platform Fee: 10% of price
Seller Amount: price - platform fee
Total Amount: item.price
```

**Order Number Format:**
```
JAT-YYYYMMDD-XXXX
JAT-20260208-1234
```

### 🎨 Modal Design

**Features:**
- Backdrop blur overlay
- Centered responsive design
- Click outside to close
- Smooth animations
- Theme color integration
- Success state with checkmark

**Using Theme Color:**
- Icon background (20% opacity)
- Submit button background
- Success checkmark icon
- Button shadow

**Form Fields:**
- نام و نام خانوادگی (Name) - Required, min 2 chars
- شماره تماس (Phone) - Required, min 10 chars

### 🔐 Validation

**Client-side:**
- HTML5 required fields
- Min length validation

**Server-side:**
```typescript
customerName: min 2 characters
customerPhone: min 10 characters
```

### 📊 Database Structure

**Order Created:**
```typescript
{
  orderNumber: "JAT-20260208-1234",
  sellerId: "...",
  customerId: null, // Guest order
  customerName: "علی احمدی",
  customerEmail: "", // Not collected
  customerPhone: "09123456789",
  status: "awaiting_approval",
  paymentStatus: "pending",
  subtotal: "50000",
  platformFee: "5000", // 10%
  sellerAmount: "45000",
  totalAmount: "50000",
  currency: "IRT",
}
```

**Order Item Created:**
```typescript
{
  orderId: "...",
  itemId: "...",
  itemName: "دوره آموزش Next.js",
  itemType: "product",
  unitPrice: "50000",
  quantity: 1,
  subtotal: "50000",
}
```

### 💡 Smart Features

✅ **Prevents double submission** - Button disabled during save
✅ **Close protection** - Can't close while saving
✅ **Auto number generation** - Unique order numbers
✅ **Transaction safety** - Order + item created atomically
✅ **Theme integration** - Uses profile's custom colors
✅ **Backdrop click** - Close on outside click
✅ **Success feedback** - Clear confirmation with order number

### 🎯 User Experience Flow

**Initial State:**
```
[Item Card] → Click
```

**Modal Opens:**
```
┌─────────────────────┐
│  خرید سریع          │
├─────────────────────┤
│  [Item Preview]     │
│  Name: _______      │
│  Phone: _______     │
│  [ثبت سفارش]        │
└─────────────────────┘
```

**Success State:**
```
┌─────────────────────┐
│  ✓ سفارش شما ثبت شد │
│  Order: JAT-xxx     │
│  [بستن]             │
└─────────────────────┘
```

### 🔄 Order Status Workflow

```
awaiting_approval → approved → paid → processing → completed
                 ↓
              cancelled
```

### 🧪 Testing

**Test Order Creation:**

1. Visit: `http://localhost:3000/ali_rezaei`
2. Click any item
3. Fill form:
   - Name: علی احمدی
   - Phone: 09123456789
4. Click "ثبت سفارش"
5. See success message with order number

**Verify in Database:**
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
SELECT * FROM order_items ORDER BY created_at DESC LIMIT 1;
```

### 🎨 Customization

**Change Platform Fee:**
```typescript
// src/app/actions/orders.ts
const platformFeePercentage = 15; // Change to 15%
```

**Add Email Field:**
```tsx
// In QuickBuyModal.tsx
<input
  type="email"
  value={customerEmail}
  onChange={(e) => setCustomerEmail(e.target.value)}
  placeholder="email@example.com"
/>
```

**Change Order Number Format:**
```typescript
const orderNumber = `ORD-${Date.now()}`;
```

### ⚡ Performance

- **Modal lazy loaded** - Only when needed
- **Form optimistic** - Instant feedback
- **Transaction atomic** - Both records or none
- **Revalidation** - Dashboard updates automatically

### 🔒 Security

✅ **Server-side validation** - Name and phone checked
✅ **SQL injection safe** - Using Drizzle ORM
✅ **No XSS** - All inputs sanitized
✅ **Transaction safety** - Atomic operations

### 🚀 Next Steps

To enhance the Quick Buy:

1. **Add quantity selector** - For products
2. **Date/time picker** - For service appointments
3. **Email collection** - For order confirmations
4. **Payment integration** - Stripe or Zarinpal
5. **Order tracking page** - Customer can track status
6. **SMS notifications** - Auto-send to customer
7. **Inventory check** - Prevent out-of-stock orders
8. **Terms checkbox** - Accept terms before order

### 📱 Mobile Optimization

- Touch-friendly inputs (48px+ targets)
- Full-screen on small devices
- Keyboard-friendly (Enter to submit)
- Prevent body scroll when open
- Smooth animations

### ♿ Accessibility

- Focus trap in modal
- ESC key to close
- ARIA labels
- Keyboard navigation
- Screen reader friendly

## Summary

Your profile pages now have a complete quick buy system! Users can order products or book services with just their name and phone number. The seller receives orders in `awaiting_approval` status and can contact the customer. 🎉
