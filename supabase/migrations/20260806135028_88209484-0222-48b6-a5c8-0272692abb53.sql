CREATE POLICY "Applicants can upload resumes"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'developer-resumes');

CREATE POLICY "Admins can read developer resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'developer-resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete developer resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'developer-resumes' AND public.has_role(auth.uid(), 'admin'));