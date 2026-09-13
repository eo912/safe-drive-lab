CREATE TABLE public.media_assets (
  storage_path text PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'foto',
  categoria text,
  modulo text,
  tag text[] NOT NULL DEFAULT '{}',
  stato text NOT NULL DEFAULT 'da-valutare',
  descrizione text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets public read" ON public.media_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_assets public insert" ON public.media_assets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "media_assets public update" ON public.media_assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_assets public delete" ON public.media_assets FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX media_assets_modulo_idx ON public.media_assets (modulo);
CREATE INDEX media_assets_stato_idx ON public.media_assets (stato);
CREATE INDEX media_assets_tag_idx ON public.media_assets USING GIN (tag);
