
-- Allow authenticated users to upload/read from these 3 buckets
CREATE POLICY "auth read project-files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('project-files','chat-attachments','client-invoices'));
CREATE POLICY "auth upload project-files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-files','chat-attachments','client-invoices'));
CREATE POLICY "owner deletes uploads" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('project-files','chat-attachments','client-invoices') AND owner = auth.uid());
