DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;

CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  category IN ('broken', 'idea', 'confusing', 'other')
  AND char_length(message) BETWEEN 1 AND 5000
  AND (email IS NULL OR char_length(email) <= 320)
  AND (page IS NULL OR char_length(page) <= 500)
);