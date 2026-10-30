-- Product review totals are derived from review records and should not be
-- entered or stored as a manually maintained product field.
ALTER TABLE public.products
  DROP COLUMN IF EXISTS review_count;

DO $$
BEGIN
  IF to_regprocedure('public.get_product_avg_rating(uuid)') IS NOT NULL THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION public.update_product_review_stats()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $body$
      DECLARE
        affected_product_id UUID;
      BEGIN
        IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
          affected_product_id := OLD.product_id;
          UPDATE public.products
          SET rating = public.get_product_avg_rating(affected_product_id),
              updated_at = NOW()
          WHERE id = affected_product_id;
        END IF;

        IF TG_OP = 'DELETE' THEN
          RETURN OLD;
        END IF;

        UPDATE public.products
        SET rating = public.get_product_avg_rating(NEW.product_id),
            updated_at = NOW()
        WHERE id = NEW.product_id;

        RETURN NEW;
      END;
      $body$;
    $function$;
  END IF;
END;
$$;
