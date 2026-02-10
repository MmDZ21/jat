# Checkout Modal - Complete Documentation

## Overview
A beautiful, mobile-first checkout modal with conditional fields for products and services, integrated with the `createOrder` Server Action.

## File Location
`/src/components/CheckoutModal.tsx`

## Features

### 🎨 Design
- ✅ Beautiful, mobile-first responsive design
- ✅ Smooth animations and transitions
- ✅ Theme color integration
- ✅ Backdrop blur overlay
- ✅ Sticky header
- ✅ Success state with order number
- ✅ Loading states
- ✅ Icon-enhanced form fields

### 📋 Conditional Fields

#### For Products (`type === "product"`)
```
✅ Customer Name (required)
✅ Phone Number (required)
✅ Email (required)
✅ Shipping Address (required, textarea)
✅ Postal Code (optional)
```

#### For Services (`type === "service"`)
```
✅ Customer Name (required)
✅ Phone Number (required)
✅ Email (required)
✅ Preferred Date/Time (required, text field)
```

### 🔒 Validation

#### Client-Side (HTML5)
- **Name**: Min 2 characters
- **Phone**: Min 10 characters, numeric only
- **Email**: Valid email format
- **Shipping Address**: Min 10 characters (products)
- **Postal Code**: Max 10 characters, numeric only
- **Preferred Date/Time**: Required text (services)

#### Server-Side (via createOrder)
- All validations from `createOrder` action
- Stock availability check (products)
- Item existence and active status

### 🎯 User Experience Flow

```
[Item Card Click]
    ↓
[Modal Opens]
    ↓
[User Fills Form]
    ├─ Product: Name, Phone, Email, Address, Postal Code
    └─ Service: Name, Phone, Email, Preferred Date/Time
    ↓
[Clicks "ثبت سفارش نهایی"]
    ↓
[Button shows loading spinner]
    ↓
[Server Action processes]
    ↓
├─ Success → [Success Screen with Order Number]
└─ Error → [Error Message displayed]
```

## Component Props

```typescript
interface CheckoutModalProps {
  item: Item;              // Item to purchase/book
  sellerId: string;        // Profile ID of seller
  themeColor: string;      // Primary color from profile
  textColor: string;       // Contrast text color
  isOpen: boolean;         // Modal visibility
  onClose: () => void;     // Close handler
}
```

## Visual Design

### Header Section
```
┌─────────────────────────────────┐
│ [📦] تکمیل سفارش          [X]   │
│      خرید محصول                 │
└─────────────────────────────────┘
```

### Item Summary
```
┌─────────────────────────────────┐
│ [Image]  دوره آموزش Next.js    │
│          آموزش جامع...           │
│          50,000 تومان            │
└─────────────────────────────────┘
```

### Form Fields (Product)
```
┌─────────────────────────────────┐
│ [👤] نام و نام خانوادگی *      │
│ [___________________________]   │
│                                  │
│ [📞] شماره تماس *               │
│ [___________________________]   │
│                                  │
│ [📧] ایمیل *                    │
│ [___________________________]   │
│                                  │
│ [📍] آدرس تحویل *               │
│ [___________________________]   │
│ [___________________________]   │
│                                  │
│ کد پستی                         │
│ [___________________________]   │
│                                  │
│ [ℹ️] توجه: پس از ثبت سفارش...  │
│                                  │
│ [📦 ثبت سفارش نهایی]            │
└─────────────────────────────────┘
```

### Success State
```
┌─────────────────────────────────┐
│         [✓]                      │
│                                  │
│   سفارش شما ثبت شد! 🎉          │
│   فروشنده به زودی تماس می‌گیرد │
│                                  │
│   شماره پیگیری سفارش:           │
│   JAT-20260209-1234             │
│   این شماره را یادداشت کنید     │
│                                  │
│   [بستن]                         │
│   [بازگشت به صفحه]               │
└─────────────────────────────────┘
```

## Integration with ProfileClient

### Updated Import
```typescript
import CheckoutModal from "@/components/CheckoutModal";
```

### Usage
```typescript
<CheckoutModal
  item={selectedItem}
  sellerId={profile.id}
  themeColor={themeColor}
  textColor={textColor}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
/>
```

## State Management

### Form State
```typescript
const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [customerEmail, setCustomerEmail] = useState("");
const [shippingAddress, setShippingAddress] = useState("");
const [postalCode, setPostalCode] = useState("");
const [preferredDateTime, setPreferredDateTime] = useState("");
```

### UI State
```typescript
const [isPending, startTransition] = useTransition();
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [orderNumber, setOrderNumber] = useState<string>("");
```

## Form Submission

### Product Order
```typescript
const result = await createOrder(
  {
    sellerId,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,      // Only for products
    postalCode,           // Only for products
    currency: "IRT",
  },
  {
    itemId: item.id,
    quantity: 1,
  }
);
```

### Service Booking
```typescript
const result = await createOrder(
  {
    sellerId,
    customerName,
    customerEmail,
    customerPhone,
    customerNote: `تاریخ و زمان ترجیحی: ${preferredDateTime}`,
    currency: "IRT",
  },
  {
    itemId: item.id,
    quantity: 1,
  }
);
```

## Loading States

### Button States

**Idle:**
```tsx
<button>
  <ShoppingBag className="w-5 h-5" />
  <span>ثبت سفارش نهایی</span>
</button>
```

**Loading:**
```tsx
<button disabled>
  <Loader2 className="w-5 h-5 animate-spin" />
  <span>در حال ثبت...</span>
</button>
```

**Success:**
```tsx
<CheckCircle className="w-12 h-12 animate-bounce" />
```

## Error Handling

### Display Errors
```typescript
if (result.error) {
  setError(result.error);
  // Error shown in red alert box above button
}
```

### Common Errors
| Error | Message |
|-------|---------|
| Invalid name | `نام و نام خانوادگی باید حداقل 2 کاراکتر باشد` |
| Invalid phone | `شماره تماس معتبر نیست` |
| Invalid email | `ایمیل معتبر نیست` |
| Out of stock | `موجودی کافی نیست. موجودی فعلی: X` |
| Item inactive | `این آیتم غیرفعال است` |
| Generic | `خطایی رخ داد` |

## Styling

### Theme Color Usage

**Icon Backgrounds:**
```typescript
style={{ backgroundColor: `${themeColor}20` }}
```

**Icon Colors:**
```typescript
style={{ color: themeColor }}
```

**Price Display:**
```typescript
style={{ color: themeColor }}
```

**Submit Button:**
```typescript
style={{
  backgroundColor: themeColor,
  color: textColor,
}}
```

### Responsive Design

**Container:**
```tsx
className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
```

**Mobile-First:**
- Touch-friendly inputs (min height 48px)
- Readable font sizes
- Proper spacing
- Smooth scrolling

## Success Screen Details

### Order Number Display
```tsx
<div className="bg-gray-50 rounded-xl p-6 mb-6">
  <p className="text-sm text-gray-500 mb-2">
    شماره پیگیری سفارش
  </p>
  <p className="text-2xl font-bold text-gray-900 font-mono">
    {orderNumber}
  </p>
  <p className="text-xs text-gray-500 mt-2">
    این شماره را برای پیگیری سفارش خود یادداشت کنید
  </p>
</div>
```

### Action Buttons
```tsx
<button>بستن</button>         // Closes and resets modal
<button>بازگشت به صفحه</button> // Same as close, secondary style
```

## Modal Behavior

### Open/Close Logic

**Opening:**
```typescript
// In ProfileClient
const handleItemClick = (item: Item) => {
  setSelectedItem(item);
  setIsModalOpen(true);
};
```

**Closing:**
```typescript
const handleClose = () => {
  if (!isPending) {  // Prevent close during submission
    // Reset all form fields
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setShippingAddress("");
    setPostalCode("");
    setPreferredDateTime("");
    setError(null);
    setSuccess(false);
    setOrderNumber("");
    onClose();
  }
};
```

**Click Outside:**
```tsx
<div onClick={handleClose}>           // Backdrop
  <div onClick={(e) => e.stopPropagation()}>  // Modal content
    {/* Content */}
  </div>
</div>
```

## Accessibility

### Form Labels
```tsx
<label htmlFor="customerName">
  <User className="w-4 h-4" />
  نام و نام خانوادگی *
</label>
<input id="customerName" ... />
```

### Required Fields
- All required fields marked with `*`
- HTML5 `required` attribute
- Min/max length constraints
- Pattern validation for phone and postal code

### Keyboard Support
- Tab navigation
- Enter to submit
- ESC to close (via backdrop click)

## Performance Optimizations

### React Transitions
```typescript
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  const result = await createOrder(...);
});
```

### Early Return
```typescript
if (!isOpen) return null;
```

### Conditional Rendering
```typescript
{isProduct && <ProductFields />}
{isService && <ServiceFields />}
```

## Testing Checklist

### Product Order
- [ ] All fields display correctly
- [ ] Shipping address and postal code required
- [ ] Submit creates order in database
- [ ] Stock decreases for product
- [ ] Success screen shows order number
- [ ] Modal closes and resets

### Service Booking
- [ ] Conditional fields switch correctly
- [ ] Preferred date/time field shown
- [ ] Shipping fields NOT shown
- [ ] Date/time saved in customerNote
- [ ] No stock changes
- [ ] Success screen shows order number

### Error Handling
- [ ] Validation errors display
- [ ] Out of stock error shows
- [ ] Server errors display in Persian
- [ ] Form stays populated on error
- [ ] Can retry after error

### UX
- [ ] Modal opens smoothly
- [ ] Backdrop click closes modal
- [ ] Can't close during submission
- [ ] Loading spinner shows
- [ ] Success animation plays
- [ ] Theme color applies correctly
- [ ] Mobile responsive

## Comparison: QuickBuyModal vs CheckoutModal

### Old: QuickBuyModal
```
Fields:
- Name
- Phone

Missing:
- Email
- Shipping address
- Service date/time
```

### New: CheckoutModal
```
Fields (Products):
- Name ✓
- Phone ✓
- Email ✓
- Shipping Address ✓
- Postal Code ✓

Fields (Services):
- Name ✓
- Phone ✓
- Email ✓
- Preferred Date/Time ✓
```

## Future Enhancements

### Potential Features

1. **Quantity Selector**
```tsx
<input 
  type="number" 
  min="1" 
  max={item.stockQuantity}
  value={quantity}
/>
```

2. **Date Picker for Services**
```tsx
<input 
  type="datetime-local"
  value={appointmentSlot}
/>
```

3. **Address Autocomplete**
```tsx
<PlacesAutocomplete
  value={shippingAddress}
  onChange={setShippingAddress}
/>
```

4. **Real-time Stock Display**
```tsx
<p className="text-sm text-gray-500">
  {item.stockQuantity} عدد موجود
</p>
```

5. **Order Notes Field**
```tsx
<textarea 
  placeholder="توضیحات اضافی برای سفارش"
  value={orderNote}
/>
```

6. **Payment Method Selection**
```tsx
<select>
  <option>پرداخت آنلاین</option>
  <option>پرداخت در محل</option>
</select>
```

## Summary

The Checkout Modal provides:

✅ Beautiful, mobile-first design  
✅ Conditional fields for products/services  
✅ Full integration with `createOrder` action  
✅ Comprehensive validation  
✅ Loading and success states  
✅ Theme color integration  
✅ Error handling with Persian messages  
✅ Clean, Apple-like aesthetic  

Perfect for the JAT platform! 🎉
