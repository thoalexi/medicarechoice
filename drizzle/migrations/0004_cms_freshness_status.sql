ALTER TABLE public.dataset_checks
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS found_release text,
  ADD COLUMN IF NOT EXISTS found_file text,
  ADD COLUMN IF NOT EXISTS found_checksum text,
  ADD COLUMN IF NOT EXISTS contents_compared boolean NOT NULL DEFAULT false;
ALTER TABLE public.formulary_documents ADD COLUMN IF NOT EXISTS coverage_year integer;

-- Publish only the exact staged version whose own validation result names its checksum.
CREATE OR REPLACE FUNCTION public.publish_dataset_version(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; ok boolean; st text; sha text; vsha text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT dataset_key, coalesce((report->>'ok')::boolean, false), status, sha256, report->>'validatedSha256'
    INTO k, ok, st, sha, vsha FROM public.dataset_versions WHERE id = _id;
  IF k IS NULL THEN RAISE EXCEPTION 'Version not found'; END IF;
  IF st <> 'staged' THEN RAISE EXCEPTION 'Only a staged version can be published'; END IF;
  IF NOT ok THEN RAISE EXCEPTION 'Version did not pass validation'; END IF;
  IF vsha IS NULL OR vsha <> sha THEN RAISE EXCEPTION 'Validation result does not belong to this exact version'; END IF;
  UPDATE public.dataset_versions SET status = 'archived' WHERE dataset_key = k AND status = 'live';
  UPDATE public.dataset_versions SET status = 'live', published_at = now() WHERE id = _id;
  INSERT INTO public.dataset_checks (dataset_key, last_updated_at, update_available) VALUES (k, now(), false)
  ON CONFLICT (dataset_key) DO UPDATE SET last_updated_at = now(), update_available = false;
END $$;
REVOKE ALL ON FUNCTION public.publish_dataset_version(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_dataset_version(uuid) TO authenticated;