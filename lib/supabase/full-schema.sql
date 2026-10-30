-- =====================================================
-- AMMIE STORE - COMPLETE SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- Includes: products, reviews, review_comments, orders
-- Category system: ready_to_ship_braided_wigs, preorder_wigs, human_hair_wigs
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
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

-- Drop the previous category constraint before migrating legacy values.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- =====================================================
-- 1. MIGRATE OLD CATEGORY VALUES (if any exist)
-- =====================================================
UPDATE public.products
SET category = CASE
  WHEN category = 'wigs' THEN 'ready_to_ship_braided_wigs'
  WHEN category = 'extensions' THEN 'preorder_wigs'
  WHEN category = 'lace' THEN 'human_hair_wigs'
  ELSE category
END
WHERE category IN ('wigs', 'extensions', 'lace');

-- Add the new category constraint
ALTER TABLE public.products
ADD CONSTRAINT products_category_check
CHECK (
  category IN (
    'ready_to_ship_braided_wigs',
    'preorder_wigs',
    'human_hair_wigs'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING GIN(to_tsvector('english', name));

-- =====================================================
-- 3. REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  location TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_image TEXT,
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. REVIEW COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ORDERS TABLE
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

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

DROP FUNCTION IF EXISTS public.create_checkout_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC
);
DROP FUNCTION IF EXISTS public.get_order_by_access_token(UUID, TEXT);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Only authenticated admins can insert products" ON products;
DROP POLICY IF EXISTS "Only authenticated admins can update products" ON products;
DROP POLICY IF EXISTS "Only authenticated admins can delete products" ON products;

DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Only authenticated admins can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Only authenticated admins can update reviews" ON reviews;
DROP POLICY IF EXISTS "Only authenticated admins can delete reviews" ON reviews;

DROP POLICY IF EXISTS "Public can view review comments" ON review_comments;
DROP POLICY IF EXISTS "Anyone can insert review comments" ON review_comments;
DROP POLICY IF EXISTS "Only authenticated admins can update review comments" ON review_comments;
DROP POLICY IF EXISTS "Only authenticated admins can delete review comments" ON review_comments;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders by ID" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Checkout can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;

-- Products policies
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Only authenticated admins can insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated admins can update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated admins can delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Reviews policies
CREATE POLICY "Public can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Only authenticated admins can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated admins can update reviews" ON reviews FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated admins can delete reviews" ON reviews FOR DELETE USING (auth.role() = 'authenticated');

-- Review comments policies
CREATE POLICY "Public can view review comments" ON review_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert review comments" ON review_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Only authenticated admins can update review comments" ON review_comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Only authenticated admins can delete review comments" ON review_comments FOR DELETE USING (auth.role() = 'authenticated');

-- Orders policies
CREATE POLICY "Checkout can create orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can manage orders" ON orders FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

REVOKE ALL ON orders FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_avg_rating(product_uuid UUID)
RETURNS DECIMAL(2,1) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = product_uuid AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  affected_product_id UUID;
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
    affected_product_id := OLD.product_id;
    UPDATE products
    SET rating = get_product_avg_rating(affected_product_id),
        updated_at = NOW()
    WHERE id = affected_product_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  UPDATE products
  SET
    rating = get_product_avg_rating(NEW.product_id),
    updated_at = NOW()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_review_comments_updated_at ON review_comments;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_product_stats_after_review ON reviews;

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_comments_updated_at 
  BEFORE UPDATE ON review_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_stats_after_review 
  AFTER INSERT OR UPDATE OR DELETE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- =====================================================
-- 9. REVIEW INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);

-- Full-text search indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_comment_search ON reviews USING GIN(to_tsvector('english', comment));
CREATE INDEX IF NOT EXISTS idx_reviews_customer_search ON reviews USING GIN(to_tsvector('english', customer_name));
CREATE INDEX IF NOT EXISTS idx_reviews_product_search ON reviews USING GIN(to_tsvector('english', product_name));

-- =====================================================
-- 10. ENABLE REAL-TIME (ignore errors if already added)
-- =====================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE review_comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- =====================================================
-- 11. VERIFY: Check for any leftover legacy category values
-- =====================================================
SELECT id, name, category
FROM public.products
WHERE category NOT IN (
  'ready_to_ship_braided_wigs',
  'preorder_wigs',
  'human_hair_wigs'
)
ORDER BY name;

-- =====================================================
-- SCHEMA SETUP COMPLETE!
-- =====================================================