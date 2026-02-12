import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  decimal,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const itemTypeEnum = pgEnum("item_type", ["product", "service"]);

export const orderStatusEnum = pgEnum("order_status", [
  "awaiting_approval", // Seller needs to approve (e.g., during sleep hours)
  "approved", // Seller approved, awaiting payment
  "paid", // Payment completed
  "processing", // Seller is preparing the order
  "completed", // Order fulfilled
  "cancelled", // Order cancelled
  "refunded", // Order refunded
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

// ============================================================================
// PROFILES TABLE
// ============================================================================

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(), // Supabase Auth user ID
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  
  // Shop Settings (Onboarding)
  shopName: varchar("shop_name", { length: 100 }), // Display name for shop
  shopSlug: varchar("shop_slug", { length: 50 }).unique(), // URL slug (e.g., jat.ir/shik_shop)
  onboardingCompleted: boolean("onboarding_completed").default(false), // Track if user completed onboarding
  
  // Contact & Social
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  instagramUsername: varchar("instagram_username", { length: 50 }), // Primary Instagram account for imports
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  }>(),

  // Seller-Specific Settings
  workingHours: jsonb("working_hours").$type<{
    monday?: { open: string; close: string; isOpen: boolean };
    tuesday?: { open: string; close: string; isOpen: boolean };
    wednesday?: { open: string; close: string; isOpen: boolean };
    thursday?: { open: string; close: string; isOpen: boolean };
    friday?: { open: string; close: string; isOpen: boolean };
    saturday?: { open: string; close: string; isOpen: boolean };
    sunday?: { open: string; close: string; isOpen: boolean };
    timezone?: string; // e.g., "America/New_York"
  }>(),
  
  leadTimeHours: integer("lead_time_hours").default(24), // Minimum hours before booking
  cancellationWindowHours: integer("cancellation_window_hours").default(24), // Hours before appointment when cancellation is blocked
  vacationMode: boolean("vacation_mode").default(false),
  vacationMessage: text("vacation_message"), // Custom message during vacation

  // Financial
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0.00"),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }), // For payouts
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).default("10.00"), // Default 10%

  // Settings
  autoApproveOrders: boolean("auto_approve_orders").default(false), // If true, skip awaiting_approval
  customDomain: varchar("custom_domain", { length: 255 }),
  isPublished: boolean("is_published").default(true),
  themeColor: text("theme_color").default("#3b82f6"), // Primary color for profile customization
  backgroundMode: varchar("background_mode", { length: 10 }).default("light"), // 'light' or 'dark'
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("profiles_username_idx").on(table.username),
  index("profiles_user_id_idx").on(table.userId),
]);

// ============================================================================
// ITEMS TABLE (Polymorphic: Products + Services)
// ============================================================================

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Common Fields
  type: itemTypeEnum("type").notNull(), // "product" or "service"
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  imageUrl: text("image_url"),
  
  // Product-Specific Fields
  stockQuantity: integer("stock_quantity"), // NULL for services
  isDigital: boolean("is_digital").default(false), // For digital products
  
  // Service-Specific Fields
  durationMinutes: integer("duration_minutes"), // NULL for products
  
  // Availability
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For custom ordering
  
  // Metadata
  tags: jsonb("tags").$type<string[]>(), // e.g., ["photography", "portrait"]
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Extra flexible data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("items_seller_id_idx").on(table.sellerId),
  index("items_type_idx").on(table.type),
  index("items_is_active_idx").on(table.isActive),
]);

// ============================================================================
// ORDERS TABLE
// ============================================================================

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(), // e.g., "JAT-20260211-7D209625"
  
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Customer Info (can be guest or registered)
  customerId: uuid("customer_id").references(() => profiles.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  shippingAddress: text("shipping_address"),
  postalCode: varchar("postal_code", { length: 10 }),
  
  // Order Status
  status: orderStatusEnum("status").default("awaiting_approval").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  
  // Financial Breakdown
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Sum of items
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Fee taken by platform
  sellerAmount: decimal("seller_amount", { precision: 10, scale: 2 }).notNull(), // Amount seller receives
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Final amount customer pays
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Payment Info
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  paidAt: timestamp("paid_at"),
  
  // Notes & Messages
  customerNote: text("customer_note"), // Customer's message to seller
  sellerNote: text("seller_note"), // Internal note for seller
  cancellationReason: text("cancellation_reason"),
  
  // Important Timestamps
  approvedAt: timestamp("approved_at"), // When seller approved
  completedAt: timestamp("completed_at"), // When order was fulfilled
  cancelledAt: timestamp("cancelled_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("orders_seller_id_idx").on(table.sellerId),
  index("orders_customer_id_idx").on(table.customerId),
  index("orders_status_idx").on(table.status),
  index("orders_order_number_idx").on(table.orderNumber),
  index("orders_created_at_idx").on(table.createdAt),
]);

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "restrict" }),
  
  // Snapshot at time of order (in case item details change later)
  itemName: varchar("item_name", { length: 200 }).notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // unitPrice * quantity
  
  // Service-Specific Fields
  appointmentSlot: timestamp("appointment_slot"), // For service bookings
  durationMinutes: integer("duration_minutes"), // Snapshot of service duration
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Extra data (variants, options, etc.)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_item_id_idx").on(table.itemId),
  index("order_items_appointment_slot_idx").on(table.appointmentSlot),
]);

// ============================================================================
// TRANSACTIONS TABLE (Wallet & Payouts)
// ============================================================================

export const transactionTypeEnum = pgEnum("transaction_type", [
  "order_payment", // Money added from order
  "payout", // Money withdrawn to bank
  "refund", // Money refunded to customer
  "platform_fee", // Fee deducted
  "adjustment", // Manual adjustment
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(), // Wallet balance after this transaction
  
  // Related Records
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  
  // Details
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_profile_id_idx").on(table.profileId),
  index("transactions_order_id_idx").on(table.orderId),
  index("transactions_type_idx").on(table.type),
  index("transactions_created_at_idx").on(table.createdAt),
]);

// ============================================================================
// SERVICE AVAILABILITY TABLE
// ============================================================================

export const serviceAvailability = pgTable("service_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),

  dayOfWeek: integer("day_of_week").notNull(), // 0=Saturday, 1=Sunday, ... 6=Friday (Persian week)
  startTime: varchar("start_time", { length: 5 }).notNull(), // "HH:mm"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "HH:mm"
  slotDuration: integer("slot_duration").default(30).notNull(), // minutes
  isBreak: boolean("is_break").default(false).notNull(), // true = break period
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sa_profile_day_idx").on(table.profileId, table.dayOfWeek),
]);

// ============================================================================
// BOOKINGS TABLE
// ============================================================================

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => items.id, { onDelete: "restrict" }),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "set null" }),

  // Customer Info
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerNote: text("customer_note"),

  // Timing (stored in UTC)
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),

  // Status
  status: bookingStatusEnum("status").default("pending").notNull(),

  // Timestamps
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("bookings_seller_time_idx").on(table.sellerId, table.startTime, table.endTime),
  index("bookings_service_time_idx").on(table.serviceId, table.startTime),
  index("bookings_status_idx").on(table.status),
  index("bookings_order_id_idx").on(table.orderId),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  items: many(items),
  ordersAsSeller: many(orders, { relationName: "seller_orders" }),
  ordersAsCustomer: many(orders, { relationName: "customer_orders" }),
  transactions: many(transactions),
  serviceAvailability: many(serviceAvailability),
  bookingsAsSeller: many(bookings, { relationName: "seller_bookings" }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  seller: one(profiles, {
    fields: [items.sellerId],
    references: [profiles.id],
  }),
  orderItems: many(orderItems),
  bookings: many(bookings),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(profiles, {
    fields: [orders.sellerId],
    references: [profiles.id],
    relationName: "seller_orders",
  }),
  customer: one(profiles, {
    fields: [orders.customerId],
    references: [profiles.id],
    relationName: "customer_orders",
  }),
  orderItems: many(orderItems),
  transactions: many(transactions),
  bookings: many(bookings),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  item: one(items, {
    fields: [orderItems.itemId],
    references: [items.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.profileId],
    references: [profiles.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const serviceAvailabilityRelations = relations(serviceAvailability, ({ one }) => ({
  profile: one(profiles, {
    fields: [serviceAvailability.profileId],
    references: [profiles.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  seller: one(profiles, {
    fields: [bookings.sellerId],
    references: [profiles.id],
    relationName: "seller_bookings",
  }),
  service: one(items, {
    fields: [bookings.serviceId],
    references: [items.id],
  }),
  order: one(orders, {
    fields: [bookings.orderId],
    references: [orders.id],
  }),
}));

// ============================================================================
// PHONE OTP VERIFICATIONS TABLE
// ============================================================================

export const phoneVerifications = pgTable("phone_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(), // Rate-limit brute force
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("phone_verif_phone_idx").on(table.phone),
  index("phone_verif_expires_idx").on(table.expiresAt),
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type ServiceAvailability = typeof serviceAvailability.$inferSelect;
export type NewServiceAvailability = typeof serviceAvailability.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type PhoneVerification = typeof phoneVerifications.$inferSelect;
export type NewPhoneVerification = typeof phoneVerifications.$inferInsert;
