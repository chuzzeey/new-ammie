-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table (simplified)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  badge TEXT,
  category TEXT NOT NULL CHECK (category IN ('ready_to_ship_braided_wigs', 'preorder_wigs', 'human_hair_wigs')),
  sizes TEXT,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage = 0 OR discount_percentage BETWEEN 5 AND 50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING GIN(to_tsvector('english', name));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can view products
CREATE POLICY "Public can view products" 
ON products FOR SELECT USING (true);

-- Only authenticated admins can insert
CREATE POLICY "Admins can insert products" 
ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated admins can update
CREATE POLICY "Admins can update products" 
ON products FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated admins can delete
CREATE POLICY "Admins can delete products" 
ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions (adjust based on your auth setup)
-- GRANT SELECT ON products TO anon;
-- GRANT ALL ON products TO authenticated;

-- =====================================================
-- REAL-TIME: Enable publication so changes broadcast
-- instantly to every connected browser without a manual
-- page refresh.  Run this in the Supabase SQL Editor
-- after the table exists.
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- =====================================================
-- ORDERS TABLE
-- Stores checkout orders with customer info and items
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_country TEXT NOT NULL DEFAULT 'Nigeria',
  customer_state TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Index for searching by customer phone
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

DROP FUNCTION IF EXISTS public.create_checkout_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC
);
DROP FUNCTION IF EXISTS public.get_order_by_access_token(UUID, TEXT);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Allow anonymous users to insert orders (they don't need auth)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders by ID" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Checkout can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;

CREATE POLICY "Authenticated users can manage orders"
ON orders FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

REVOKE ALL ON orders FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

-- Enable real-time for orders table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
