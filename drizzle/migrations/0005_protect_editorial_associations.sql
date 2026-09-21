REVOKE SELECT, INSERT, UPDATE ON public.editorial_associations FROM anon;

DROP POLICY IF EXISTS "editorial associations public read"
  ON public.editorial_associations;
DROP POLICY IF EXISTS "editorial associations public insert"
  ON public.editorial_associations;
DROP POLICY IF EXISTS "editorial associations public update"
  ON public.editorial_associations;

CREATE POLICY "editorial associations instructor read"
  ON public.editorial_associations FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'instructor'
  );

CREATE POLICY "editorial associations instructor insert"
  ON public.editorial_associations FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'instructor'
  );

CREATE POLICY "editorial associations instructor update"
  ON public.editorial_associations FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'instructor'
  )
  WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'instructor'
  );
