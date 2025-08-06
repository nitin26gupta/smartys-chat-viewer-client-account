-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Create comprehensive storage policies for the bucket
CREATE POLICY "Allow authenticated uploads to smartys bucket"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'smartys-autozubehor-whatsapp-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to smartys bucket files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'smartys-autozubehor-whatsapp-images');

CREATE POLICY "Allow authenticated updates to smartys bucket"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'smartys-autozubehor-whatsapp-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes from smartys bucket"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'smartys-autozubehor-whatsapp-images' 
  AND auth.role() = 'authenticated'
);