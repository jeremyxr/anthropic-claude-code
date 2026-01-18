-- Create storage bucket for uploaded images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow anyone to view images (public bucket)
CREATE POLICY "Allow public access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Allow users to update their own uploaded images
CREATE POLICY "Allow users to update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Allow users to delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
