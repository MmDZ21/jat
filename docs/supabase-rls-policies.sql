-- =============================================================================
-- Row Level Security (RLS) for Dashboard & Checkout
-- Run this in Supabase SQL Editor if your app uses Supabase Postgres.
-- Tables: items (products/services), orders, order_items
-- =============================================================================

-- Helper: current user's profile id (profiles.user_id = auth.uid())
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid()::text LIMIT 1;
$$;

-- =============================================================================
-- ITEMS (products + services)
-- Public: SELECT (so shop pages and checkout can read).
-- Sellers: INSERT/UPDATE/DELETE only their own (seller_id = get_my_profile_id()).
-- =============================================================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_select_public" ON items;
CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "items_insert_own" ON items;
CREATE POLICY "items_insert_own"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = get_my_profile_id());

DROP POLICY IF EXISTS "items_update_own" ON items;
CREATE POLICY "items_update_own"
  ON items FOR UPDATE
  TO authenticated
  USING (seller_id = get_my_profile_id())
  WITH CHECK (seller_id = get_my_profile_id());

DROP POLICY IF EXISTS "items_delete_own" ON items;
CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  TO authenticated
  USING (seller_id = get_my_profile_id());

-- =============================================================================
-- ORDERS
-- Sellers: SELECT/UPDATE/DELETE only their orders (seller_id = get_my_profile_id()).
-- Public: INSERT (so checkout can create orders without auth).
-- =============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_seller" ON orders;
CREATE POLICY "orders_select_seller"
  ON orders FOR SELECT
  TO authenticated
  USING (seller_id = get_my_profile_id());

DROP POLICY IF EXISTS "orders_insert_public" ON orders;
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_seller" ON orders;
CREATE POLICY "orders_update_seller"
  ON orders FOR UPDATE
  TO authenticated
  USING (seller_id = get_my_profile_id())
  WITH CHECK (seller_id = get_my_profile_id());

DROP POLICY IF EXISTS "orders_delete_seller" ON orders;
CREATE POLICY "orders_delete_seller"
  ON orders FOR DELETE
  TO authenticated
  USING (seller_id = get_my_profile_id());

-- =============================================================================
-- ORDER_ITEMS
-- Public: SELECT and INSERT (checkout reads items and creates order lines).
-- Sellers: UPDATE/DELETE only for their orders (via order ownership).
-- =============================================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_public" ON order_items;
CREATE POLICY "order_items_select_public"
  ON order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "order_items_insert_public" ON order_items;
CREATE POLICY "order_items_insert_public"
  ON order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_seller" ON order_items;
CREATE POLICY "order_items_update_seller"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE seller_id = get_my_profile_id())
  )
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE seller_id = get_my_profile_id())
  );

DROP POLICY IF EXISTS "order_items_delete_seller" ON order_items;
CREATE POLICY "order_items_delete_seller"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE seller_id = get_my_profile_id())
  );
