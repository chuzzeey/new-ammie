-- =====================================================
-- ADD MISSING COLUMNS TO REVIEWS TABLE
-- Run this if you get "Could not find the 'date' column" error
-- =====================================================

-- Add date column if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS date TEXT;

-- Optional: Add customer_avatar column if missing
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_avatar TEXT;

-- Optional: Add product_image column if missing  
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_image TEXT;

-- =====================================================
-- DONE! Now try adding a review again
-- =====================================================