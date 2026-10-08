CREATE TABLE public.formulary_documents (
  plan_id text PRIMARY KEY,
  url text NOT NULL,
  title text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.formulary_documents TO service_role;
ALTER TABLE public.formulary_documents ENABLE ROW LEVEL SECURITY;