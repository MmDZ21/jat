# Migration Guide: Update Quick Buy to Use New createOrder Action

## Overview
This guide shows how to update the Quick Buy modal to use the new comprehensive `createOrder()` action instead of the simpler `createQuickOrder()`.

## Benefits of New Action
- ✅ Fetches platform fee from seller profile (dynamic)
- ✅ Better stock management
- ✅ More comprehensive validation
- ✅ Data snapshotting
- ✅ Supports shipping address and postal code
- ✅ Atomic transactions

## Step 1: Update QuickBuyModal.tsx

### Import the New Action
```typescript
// Old import
import { createQuickOrder } from "@/app/actions/orders";

// New import
import { createOrder } from "@/app/actions/order-actions";
```

### Update the handleSubmit Function

**Before:**
```typescript
const result = await createQuickOrder({
  sellerId,
  itemId: item.id,
  itemName: item.name,
  itemType: item.type,
  itemPrice: item.price,
  customerName,
  customerPhone,
});
```

**After:**
```typescript
const result = await createOrder(
  {
    sellerId,
    customerName,
    customerEmail: "", // Add email field or use placeholder
    customerPhone,
    currency: "IRT",
  },
  {
    itemId: item.id,
    quantity: 1,
  }
);
```

### Complete Updated handleSubmit
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  startTransition(async () => {
    const result = await createOrder(
      {
        sellerId,
        customerName,
        customerEmail: `${customerPhone}@temp.jat`, // Temporary email
        customerPhone,
        currency: "IRT",
      },
      {
        itemId: item.id,
        quantity: 1,
      }
    );

    if (result.success) {
      setSuccess(true);
      setOrderNumber(result.orderNumber || "");
    } else {
      setError(result.error || "خطایی رخ داد");
    }
  });
};
```

## Step 2: Optional - Add Email Field

If you want to collect email addresses:

### Add State
```typescript
const [customerEmail, setCustomerEmail] = useState("");
```

### Add Input Field
```tsx
<div>
  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
    ایمیل *
  </label>
  <input
    type="email"
    id="customerEmail"
    value={customerEmail}
    onChange={(e) => setCustomerEmail(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
    placeholder="ali@example.com"
    required
    disabled={isPending}
  />
</div>
```

### Update Submit
```typescript
const result = await createOrder(
  {
    sellerId,
    customerName,
    customerEmail, // Now using real email
    customerPhone,
    currency: "IRT",
  },
  {
    itemId: item.id,
    quantity: 1,
  }
);
```

## Step 3: Optional - Add Shipping Fields

For product orders that need shipping:

### Add States
```typescript
const [shippingAddress, setShippingAddress] = useState("");
const [postalCode, setPostalCode] = useState("");
```

### Add Conditional Fields
```tsx
{item.type === "product" && (
  <>
    <div>
      <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-2">
        آدرس تحویل *
      </label>
      <textarea
        id="shippingAddress"
        value={shippingAddress}
        onChange={(e) => setShippingAddress(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
        placeholder="تهران، خیابان ولیعصر، پلاک 123"
        rows={3}
        required
        disabled={isPending}
      />
    </div>

    <div>
      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
        کد پستی
      </label>
      <input
        type="text"
        id="postalCode"
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
        placeholder="1234567890"
        disabled={isPending}
      />
    </div>
  </>
)}
```

### Update Submit
```typescript
const result = await createOrder(
  {
    sellerId,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: item.type === "product" ? shippingAddress : undefined,
    postalCode: item.type === "product" ? postalCode : undefined,
    currency: "IRT",
  },
  {
    itemId: item.id,
    quantity: 1,
  }
);
```

## Step 4: Handle Stock Errors

The new action returns specific stock errors:

```typescript
if (result.success) {
  setSuccess(true);
  setOrderNumber(result.orderNumber || "");
} else {
  // Check for specific errors
  if (result.error?.includes("موجودی کافی نیست")) {
    setError("متأسفانه این محصول در انبار موجود نیست");
  } else if (result.error?.includes("غیرفعال است")) {
    setError("این محصول دیگر در دسترس نیست");
  } else {
    setError(result.error || "خطایی رخ داد");
  }
}
```

## Step 5: Remove Old Action File (Optional)

After updating all usages:

```bash
# Delete old simple action
rm src/app/actions/orders.ts
```

## Complete Example: Updated QuickBuyModal

```typescript
"use client";

import { useState, useTransition } from "react";
import { createOrder } from "@/app/actions/order-actions";
import { X, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import type { Item } from "@/db/schema";

interface QuickBuyModalProps {
  item: Item;
  sellerId: string;
  themeColor: string;
  textColor: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickBuyModal({
  item,
  sellerId,
  themeColor,
  textColor,
  isOpen,
  onClose,
}: QuickBuyModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOrder(
        {
          sellerId,
          customerName,
          customerEmail: customerEmail || `${customerPhone}@temp.jat`,
          customerPhone,
          currency: "IRT",
        },
        {
          itemId: item.id,
          quantity: 1,
        }
      );

      if (result.success) {
        setSuccess(true);
        setOrderNumber(result.orderNumber || "");
      } else {
        setError(result.error || "خطایی رخ داد");
      }
    });
  };

  // ... rest of the component (same as before)
}
```

## Testing Checklist

After migration:

- [ ] Quick Buy still works for products
- [ ] Quick Buy still works for services
- [ ] Stock decreases for product orders
- [ ] Stock doesn't change for service orders
- [ ] Out-of-stock products show error
- [ ] Orders appear in dashboard
- [ ] Order numbers are unique
- [ ] Platform fee uses seller's percentage
- [ ] Success message shows order number
- [ ] Error messages display in Persian

## Rollback Plan

If issues occur, you can temporarily revert:

1. Change import back to `createQuickOrder`
2. Revert the function call
3. Keep old `orders.ts` file

But the new action is recommended for production! 🚀
