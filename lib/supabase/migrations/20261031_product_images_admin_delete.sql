-- Allow authenticated admins to clean up product images regardless of
-- which admin account originally uploaded them.
DROP POLICY IF EXISTS "Admins can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
