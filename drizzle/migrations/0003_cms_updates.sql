CREATE TYPE public.app_role AS ENUM ('owner');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.dataset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_key text NOT NULL CHECK (dataset_key IN ('stars','figures')),
  coverage_year int NOT NULL,
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged','live','archived','rejected')),
  source_url text,
  source_published date,
  sha256 text NOT NULL,
  payload jsonb NOT NULL,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (dataset_key, sha256)
);
CREATE UNIQUE INDEX dataset_versions_one_live ON public.dataset_versions (dataset_key) WHERE status = 'live';
GRANT SELECT, INSERT, UPDATE ON public.dataset_versions TO authenticated;
GRANT ALL ON public.dataset_versions TO service_role;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages versions" ON public.dataset_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.dataset_checks (
  dataset_key text PRIMARY KEY,
  last_checked_at timestamptz,
  last_updated_at timestamptz,
  found_url text,
  update_available boolean NOT NULL DEFAULT false,
  note text
);
GRANT SELECT, INSERT, UPDATE ON public.dataset_checks TO authenticated;
GRANT ALL ON public.dataset_checks TO service_role;
ALTER TABLE public.dataset_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages checks" ON public.dataset_checks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Atomic publish / restore: only one live version per dataset; failure leaves the old live row untouched.
CREATE OR REPLACE FUNCTION public.publish_dataset_version(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; ok boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT dataset_key, coalesce((report->>'ok')::boolean, false) INTO k, ok FROM public.dataset_versions WHERE id = _id;
  IF k IS NULL THEN RAISE EXCEPTION 'Version not found'; END IF;
  IF NOT ok THEN RAISE EXCEPTION 'Version did not pass validation'; END IF;
  UPDATE public.dataset_versions SET status = 'archived' WHERE dataset_key = k AND status = 'live';
  UPDATE public.dataset_versions SET status = 'live', published_at = now() WHERE id = _id;
  INSERT INTO public.dataset_checks (dataset_key, last_updated_at, update_available) VALUES (k, now(), false)
  ON CONFLICT (dataset_key) DO UPDATE SET last_updated_at = now(), update_available = false;
END $$;
REVOKE ALL ON FUNCTION public.publish_dataset_version(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_dataset_version(uuid) TO authenticated;

-- Restore: archive the current live version and re-publish the most recent previously published one (or fall back to built-in data if none).
CREATE OR REPLACE FUNCTION public.restore_previous_version(_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur uuid; prev uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT id INTO cur FROM public.dataset_versions WHERE dataset_key = _key AND status = 'live';
  IF cur IS NULL THEN RAISE EXCEPTION 'Already using the built-in data'; END IF;
  SELECT id INTO prev FROM public.dataset_versions WHERE dataset_key = _key AND status = 'archived' AND published_at IS NOT NULL
    ORDER BY published_at DESC LIMIT 1;
  UPDATE public.dataset_versions SET status = 'archived' WHERE id = cur;
  IF prev IS NOT NULL THEN
    UPDATE public.dataset_versions SET status = 'live', published_at = now() WHERE id = prev;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.restore_previous_version(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_previous_version(text) TO authenticated;

-- Public read of live payloads only (no other columns, no staged data).
CREATE OR REPLACE FUNCTION public.get_live_datasets()
RETURNS TABLE (dataset_key text, payload jsonb, published_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT dataset_key, payload, published_at FROM public.dataset_versions WHERE status = 'live'
$$;
GRANT EXECUTE ON FUNCTION public.get_live_datasets() TO anon, authenticated;