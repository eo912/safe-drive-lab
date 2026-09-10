CREATE POLICY "course-images read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "course-images insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "course-images update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'course-images')
  WITH CHECK (bucket_id = 'course-images');