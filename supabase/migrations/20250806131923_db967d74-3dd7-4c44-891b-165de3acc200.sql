-- Create storage policies for file uploads
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'smartys-autozubehor-whatsapp-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'smartys-autozubehor-whatsapp-images');

CREATE POLICY "Authenticated users can update files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'smartys-autozubehor-whatsapp-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'smartys-autozubehor-whatsapp-images' AND auth.uid() IS NOT NULL);

-- Enable realtime for chat histories to show file uploads immediately
ALTER TABLE smartys_chat_histories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE smartys_chat_histories;