CREATE TABLE public.placeholder_images (
  placeholder_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.placeholder_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placeholder_images TO authenticated;
GRANT ALL ON public.placeholder_images TO service_role;

ALTER TABLE public.placeholder_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "placeholder_images public read"
  ON public.placeholder_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "placeholder_images public insert"
  ON public.placeholder_images FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "placeholder_images public update"
  ON public.placeholder_images FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "placeholder_images public delete"
  ON public.placeholder_images FOR DELETE
  TO anon, authenticated
  USING (true);