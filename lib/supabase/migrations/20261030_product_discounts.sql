ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percentage INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_discount_percentage_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_discount_percentage_check
  CHECK (discount_percentage = 0 OR discount_percentage BETWEEN 5 AND 50);
