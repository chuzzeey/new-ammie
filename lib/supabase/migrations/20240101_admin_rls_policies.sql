-- =====================================================
-- ADMIN AUTHORIZATION & RLS POLICIES FOR PRODUCTS
-- =====================================================
-- Run this entire file in the Supabase SQL Editor (set limit to "No limit").
-- This will reset and properly configure everything.
-- =====================================================

-- =====================================================
-- 1. DROP everything first for a clean reset
-- =====================================================
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS add_admin_by_email(text) CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop all old policies on products & orders
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders by ID" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- =====================================================
-- 2. CREATE ADMINS TABLE
-- =====================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admins_id ON admins(id);

-- =====================================================
-- 3. is_admin() FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
END;
$$;

-- =====================================================
-- 4. PRODUCTS RLS POLICIES
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can view products
CREATE POLICY "Public can view products"
ON products FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (is_admin());

-- Only admins can delete
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (is_admin());

-- =====================================================
-- 5. ORDERS RLS POLICIES
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone can place an order
CREATE POLICY "Anyone can insert orders"
ON orders FOR INSERT
WITH CHECK (true);

-- Anyone can view an order
CREATE POLICY "Anyone can view orders"
ON orders FOR SELECT
USING (true);

-- Only admins can update orders
CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (is_admin());

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (is_admin());

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON products TO anon;
GRANT ALL ON products TO authenticated;
GRANT INSERT, SELECT ON orders TO anon;
GRANT ALL ON orders TO authenticated;

-- =====================================================
-- 7. ADD adminn@gmail.com AS ADMIN
-- =====================================================
INSERT INTO admins (id)
SELECT id FROM auth.users WHERE email = 'adminn@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. VERIFY
-- =====================================================
-- Run this to check: SELECT is_admin();
-- It will return false in SQL Editor (no active session)
-- but true when logged into the app.
--
-- To verify in the app:
-- 1. Go to http://localhost:3000/admin/login
-- 2. Sign in with adminn@gmail.com
-- 3. The admin dashboard will load and CRUD will work
-- =====================================================