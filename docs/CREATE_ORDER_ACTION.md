# Create Order Server Action - Documentation

## Overview
A robust, production-ready Server Action for creating orders with automatic financial calculations, stock management, and data snapshotting.

## File Location
`/src/app/actions/order-actions.ts`

## Main Function: `createOrder()`

### Signature
```typescript
createOrder(
  orderData: OrderData,
  itemDetails: ItemDetails
): Promise<CreateOrderResult>
```

### Parameters

#### `OrderData`
```typescript
interface OrderData {
  sellerId: string;           // Required: Profile ID of the seller
  customerId?: string | null; // Optional: Profile ID of buyer (null for guests)
  customerName: string;       // Required: Full name (min 2 chars)
  customerEmail: string;      // Required: Valid email
  customerPhone: string;      // Required: Phone (min 10 chars)
  shippingAddress?: string;   // Optional: Delivery address
  postalCode?: string;        // Optional: Postal/ZIP code
  customerNote?: string;      // Optional: Message to seller
  currency?: string;          // Optional: Default "IRT"
}
```

#### `ItemDetails`
```typescript
interface ItemDetails {
  itemId: string;             // Required: Item UUID
  quantity?: number;          // Optional: Default 1
  appointmentSlot?: Date | null; // Optional: For service bookings
}
```

#### `CreateOrderResult`
```typescript
interface CreateOrderResult {
  success: boolean;
  orderId?: string;           // UUID of created order
  orderNumber?: string;       // JAT-YYYYMMDD-XXXX
  error?: string;             // Persian error message
}
```

## Features

### ✅ 1. Validation
- **Customer Name**: Min 2 characters
- **Customer Phone**: Min 10 characters
- **Customer Email**: Must contain "@"
- **Quantity**: Min 1
- **Item Existence**: Checks if item exists
- **Item Status**: Checks if item is active
- **Stock Check**: For products, verifies sufficient stock

### ✅ 2. Order Number Generation
**Format:** `JAT-YYYYMMDD-XXXX`

**Examples:**
```
JAT-20260208-0001
JAT-20260208-9876
JAT-20261225-4521
```

**Components:**
- `JAT`: Platform prefix
- `YYYYMMDD`: Date (2026-02-08 → 20260208)
- `XXXX`: Random 4-digit suffix (0000-9999)

### ✅ 3. Financial Calculations

**Process:**
1. Fetch seller's `platformFeePercentage` from profile (default: 10%)
2. Calculate subtotal: `unitPrice × quantity`
3. Calculate platform fee: `subtotal × feePercentage ÷ 100`
4. Calculate seller amount: `subtotal - platformFee`
5. Set total amount: `subtotal` (can add shipping/tax later)

**Example:**
```typescript
Item Price: 50,000 IRT
Quantity: 2
Seller's Fee: 15%

Subtotal: 100,000 IRT
Platform Fee: 15,000 IRT (15%)
Seller Amount: 85,000 IRT
Total Amount: 100,000 IRT
```

### ✅ 4. Data Snapshotting

**Order Items** table stores snapshot data:
- `itemName`: Snapshot of item name (prevents issues if renamed)
- `itemType`: Snapshot of type ("product" or "service")
- `unitPrice`: Snapshot of price (preserves historical pricing)
- `durationMinutes`: Snapshot of service duration

**Why?** If seller changes item name/price later, existing orders remain unchanged.

### ✅ 5. Stock Management

**For Products Only:**
- Checks current stock before order creation
- Returns error if insufficient stock
- Automatically decreases `stockQuantity` by order quantity
- Updates `updatedAt` timestamp
- **Atomic operation**: Stock only decreases if entire order succeeds

**Example:**
```typescript
Current Stock: 10 units
Order Quantity: 3 units
→ New Stock: 7 units

Current Stock: 2 units
Order Quantity: 5 units
→ Error: "موجودی کافی نیست. موجودی فعلی: 2"
```

### ✅ 6. Database Transaction

**All operations are atomic:**
```
BEGIN TRANSACTION
  1. Fetch item details
  2. Validate stock (if product)
  3. Fetch seller's fee percentage
  4. Calculate financials
  5. Insert into orders table
  6. Insert into order_items table
  7. Decrease stock (if product)
COMMIT

If any step fails → ROLLBACK (no partial data)
```

### ✅ 7. Path Revalidation

After successful order creation:
```typescript
revalidatePath("/dashboard");          // Seller's dashboard
revalidatePath(`/${orderData.sellerId}`); // Public profile
```

## Usage Examples

### Example 1: Simple Product Order
```typescript
import { createOrder } from "@/app/actions/order-actions";

const result = await createOrder(
  {
    sellerId: "seller-uuid-123",
    customerName: "علی احمدی",
    customerEmail: "ali@example.com",
    customerPhone: "09123456789",
    shippingAddress: "تهران، خیابان ولیعصر، پلاک 123",
    postalCode: "1234567890",
  },
  {
    itemId: "item-uuid-456",
    quantity: 2,
  }
);

if (result.success) {
  console.log("Order created:", result.orderNumber);
  console.log("Order ID:", result.orderId);
} else {
  console.error("Error:", result.error);
}
```

### Example 2: Service Booking
```typescript
const appointmentDate = new Date("2026-02-15T10:00:00");

const result = await createOrder(
  {
    sellerId: "photographer-uuid",
    customerName: "مریم رضایی",
    customerEmail: "maryam@example.com",
    customerPhone: "09123456789",
    customerNote: "میخواهم عکس‌های خانوادگی بگیرم",
  },
  {
    itemId: "photography-service-uuid",
    quantity: 1,
    appointmentSlot: appointmentDate,
  }
);
```

### Example 3: Guest Order (No Customer ID)
```typescript
const result = await createOrder(
  {
    sellerId: "seller-uuid",
    customerId: null, // Guest order
    customerName: "میهمان",
    customerEmail: "guest@example.com",
    customerPhone: "09123456789",
  },
  {
    itemId: "item-uuid",
    quantity: 1,
  }
);
```

### Example 4: Error Handling
```typescript
const result = await createOrder(orderData, itemDetails);

if (!result.success) {
  switch (result.error) {
    case "موجودی کافی نیست. موجودی فعلی: 2":
      // Show out of stock message
      break;
    case "این آیتم غیرفعال است":
      // Item is no longer available
      break;
    case "آیتم یافت نشد":
      // Item was deleted
      break;
    default:
      // Generic error
      console.error(result.error);
  }
}
```

## Database Structure

### Orders Table Entry
```typescript
{
  id: "uuid-generated",
  orderNumber: "JAT-20260208-1234",
  sellerId: "seller-uuid",
  customerId: "customer-uuid" | null,
  customerName: "علی احمدی",
  customerEmail: "ali@example.com",
  customerPhone: "09123456789",
  shippingAddress: "تهران، خیابان ولیعصر",
  postalCode: "1234567890",
  status: "awaiting_approval",
  paymentStatus: "pending",
  subtotal: "100000.00",
  platformFee: "15000.00",
  sellerAmount: "85000.00",
  totalAmount: "100000.00",
  currency: "IRT",
  customerNote: "لطفاً تا ساعت 5 تحویل دهید",
  createdAt: "2026-02-08T10:30:00Z",
}
```

### Order Items Table Entry
```typescript
{
  id: "uuid-generated",
  orderId: "order-uuid",
  itemId: "item-uuid",
  itemName: "دوره آموزش Next.js",     // Snapshot
  itemType: "product",                 // Snapshot
  unitPrice: "50000.00",               // Snapshot
  quantity: 2,
  subtotal: "100000.00",
  appointmentSlot: null,
  durationMinutes: null,
  createdAt: "2026-02-08T10:30:00Z",
}
```

### Items Table (After Stock Update)
```typescript
{
  id: "item-uuid",
  name: "دوره آموزش Next.js",
  stockQuantity: 7,  // Was 10, decreased by 3
  updatedAt: "2026-02-08T10:30:00Z",
}
```

## Error Messages (Persian)

| Error | Message |
|-------|---------|
| Invalid name | `نام و نام خانوادگی باید حداقل 2 کاراکتر باشد` |
| Invalid phone | `شماره تماس معتبر نیست` |
| Invalid email | `ایمیل معتبر نیست` |
| Invalid quantity | `تعداد باید حداقل 1 باشد` |
| Item not found | `آیتم یافت نشد` |
| Item inactive | `این آیتم غیرفعال است` |
| Insufficient stock | `موجودی کافی نیست. موجودی فعلی: {stock}` |
| Seller not found | `فروشنده یافت نشد` |
| Generic error | `خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.` |

## Helper Function: `generateOrderNumber()`

### Signature
```typescript
generateOrderNumber(): string
```

### Description
Generates a unique order number in the format `JAT-YYYYMMDD-XXXX`.

### Usage
```typescript
import { generateOrderNumber } from "@/app/actions/order-actions";

const orderNum = generateOrderNumber();
// Returns: "JAT-20260208-4521"
```

## Testing

### Test Case 1: Successful Product Order
```typescript
// Given: Item exists, has stock = 10
const result = await createOrder(
  {
    sellerId: "test-seller",
    customerName: "Test User",
    customerEmail: "test@test.com",
    customerPhone: "0912345678",
  },
  { itemId: "test-item", quantity: 3 }
);

// Expected:
// - result.success === true
// - result.orderId exists
// - result.orderNumber matches pattern
// - Stock decreased to 7
```

### Test Case 2: Out of Stock
```typescript
// Given: Item has stock = 2
const result = await createOrder(
  orderData,
  { itemId: "test-item", quantity: 5 }
);

// Expected:
// - result.success === false
// - result.error === "موجودی کافی نیست. موجودی فعلی: 2"
// - Stock unchanged (still 2)
```

### Test Case 3: Service Booking
```typescript
// Given: Item type = "service"
const result = await createOrder(
  orderData,
  {
    itemId: "service-item",
    quantity: 1,
    appointmentSlot: new Date("2026-02-15T10:00:00"),
  }
);

// Expected:
// - result.success === true
// - Stock unchanged (services don't track stock)
// - appointmentSlot saved in order_items
```

### Test Case 4: Custom Platform Fee
```typescript
// Given: Seller has platformFeePercentage = 20%
// Item price = 100,000 IRT
const result = await createOrder(
  { sellerId: "seller-with-20-percent-fee", ... },
  { itemId: "item-100k", quantity: 1 }
);

// Expected order financials:
// - subtotal: 100,000
// - platformFee: 20,000 (20%)
// - sellerAmount: 80,000
// - totalAmount: 100,000
```

## Security & Best Practices

### ✅ Security Features
- Server-side validation (never trust client)
- SQL injection protection (Drizzle ORM)
- Atomic transactions (no partial data)
- Stock race condition prevention (fetch then update in transaction)
- Input sanitization (.trim() on all strings)

### ✅ Performance
- Single transaction for all operations
- Minimal database queries (efficient relations)
- Selective column fetching (only platformFeePercentage)
- Path revalidation for cache updates

### ✅ Data Integrity
- Foreign key constraints (sellerId, itemId references)
- NOT NULL constraints on required fields
- Decimal precision for money (10,2)
- Snapshot data prevents historical inconsistencies

## Future Enhancements

### 📋 Potential Additions

1. **Tax Calculation**
```typescript
const tax = subtotal * 0.09; // 9% VAT
const totalAmount = subtotal + tax;
```

2. **Shipping Costs**
```typescript
const shippingCost = calculateShipping(postalCode);
const totalAmount = subtotal + shippingCost;
```

3. **Discount Codes**
```typescript
if (discountCode) {
  const discount = await validateDiscount(discountCode);
  subtotal = subtotal * (1 - discount.percentage / 100);
}
```

4. **Inventory Reservation**
```typescript
// Reserve stock for 10 minutes before payment
await reserveStock(itemId, quantity, 10);
```

5. **Email Notifications**
```typescript
await sendOrderConfirmation(customerEmail, orderNumber);
await notifySeller(sellerId, orderNumber);
```

6. **Order Analytics**
```typescript
await trackOrderEvent("order_created", {
  orderId,
  value: totalAmount,
  sellerId,
});
```

## Summary

The `createOrder()` Server Action provides a complete, production-ready order creation system with:

✅ Comprehensive validation  
✅ Automatic financial calculations from seller profile  
✅ Smart stock management for products  
✅ Data snapshotting for historical accuracy  
✅ Atomic transactions for data integrity  
✅ Persian error messages  
✅ Type-safe TypeScript interfaces  

Use this for all order creation throughout JAT! 🎉
