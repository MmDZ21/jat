# Summary: createOrder Server Action

## 📍 File Created
`/src/app/actions/order-actions.ts`

## 🎯 What It Does

A comprehensive Server Action that creates orders with:

1. **Automatic Financial Calculations**
   - Fetches seller's `platformFeePercentage` from their profile
   - Calculates: subtotal, platformFee, sellerAmount, totalAmount

2. **Smart Stock Management**
   - Checks if product has sufficient stock
   - Decreases `stockQuantity` automatically
   - Only for products (services skip this)

3. **Data Snapshotting**
   - Saves item name, type, and price in `order_items`
   - Prevents issues if seller changes item details later

4. **Unique Order Numbers**
   - Format: `JAT-YYYYMMDD-XXXX`
   - Example: `JAT-20260208-1234`

5. **Full Validation**
   - Customer name (min 2 chars)
   - Customer phone (min 10 chars)
   - Customer email (must have @)
   - Quantity (min 1)
   - Item exists and is active
   - Sufficient stock (for products)

6. **Atomic Transactions**
   - All database operations succeed or all fail
   - No partial data corruption

## 📝 Usage Example

```typescript
import { createOrder } from "@/app/actions/order-actions";

const result = await createOrder(
  {
    sellerId: "uuid-123",
    customerName: "علی احمدی",
    customerEmail: "ali@example.com",
    customerPhone: "09123456789",
    shippingAddress: "تهران، خیابان ولیعصر",
    postalCode: "1234567890",
  },
  {
    itemId: "uuid-456",
    quantity: 2,
  }
);

if (result.success) {
  console.log("Order ID:", result.orderId);
  console.log("Order Number:", result.orderNumber);
} else {
  console.error("Error:", result.error);
}
```

## 💡 Key Features

### Financial Calculation Flow
```
1. Fetch item price: 50,000 IRT
2. Calculate subtotal: 50,000 × 2 = 100,000 IRT
3. Get seller's fee: 15% (from profile)
4. Calculate platform fee: 100,000 × 0.15 = 15,000 IRT
5. Calculate seller amount: 100,000 - 15,000 = 85,000 IRT
6. Total amount: 100,000 IRT
```

### Stock Management
```
Before Order:
  Item: "Next.js Course"
  Stock: 10 units

After Order (quantity: 3):
  Item: "Next.js Course"
  Stock: 7 units
```

### Data Snapshotting
```
Order Items Table (snapshot):
  itemName: "دوره آموزش Next.js"
  itemType: "product"
  unitPrice: "50000.00"

Even if seller later changes:
  - Item name → "دوره پیشرفته Next.js"
  - Item price → "60000.00"

The order still shows the original values!
```

## 🔒 Transaction Safety

```sql
BEGIN TRANSACTION;
  -- 1. Fetch item
  -- 2. Check stock
  -- 3. Fetch seller fee
  -- 4. Insert order
  -- 5. Insert order item
  -- 6. Decrease stock
COMMIT;

-- If ANY step fails, ALL changes are rolled back
```

## 📊 Database Tables Affected

### `orders` (INSERT)
- Creates new order with calculated financials
- Status: `awaiting_approval`
- Payment Status: `pending`

### `order_items` (INSERT)
- Links order to item
- Snapshots item details
- Records quantity and subtotal

### `items` (UPDATE)
- Decreases `stockQuantity` (products only)
- Updates `updatedAt` timestamp

## 🌟 Comparison: Old vs New

### Old Action (`createQuickOrder`)
```typescript
// Hardcoded 10% fee
const platformFeePercentage = 10;

// No stock check
// No stock decrease
// Basic validation
```

### New Action (`createOrder`)
```typescript
// Dynamic fee from seller profile
const feePercentage = parseFloat(seller.platformFeePercentage || "10.00");

// Checks stock availability
// Automatically decreases stock
// Comprehensive validation
// Data snapshotting
// Atomic transactions
```

## 📚 Documentation Files

1. **`CREATE_ORDER_ACTION.md`** - Complete technical documentation
2. **`MIGRATION_GUIDE_CREATE_ORDER.md`** - How to update Quick Buy modal

## ✅ Ready to Use!

You can now:

1. **Use directly** in any form/component
2. **Update Quick Buy modal** (see migration guide)
3. **Create checkout pages** with full order flow
4. **Build seller dashboards** with order management

The Server Action handles all the complex logic! 🎉
