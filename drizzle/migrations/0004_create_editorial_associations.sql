CREATE TABLE public.editorial_associations (
  module_id text NOT NULL,
  block_id text NOT NULL,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  embeds jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (module_id, block_id)
);

GRANT SELECT, INSERT, UPDATE ON public.editorial_associations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.editorial_associations TO authenticated;
GRANT ALL ON public.editorial_associations TO service_role;

ALTER TABLE public.editorial_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial associations public read"
  ON public.editorial_associations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "editorial associations public insert"
  ON public.editorial_associations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "editorial associations public update"
  ON public.editorial_associations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
