-- Storage Policies for family-os and avatar buckets

-- Allow authenticated users to upload objects to any bucket
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('family-os', 'avatar'));

-- Allow authenticated users to select/read objects from any bucket
CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('family-os', 'avatar'));

-- Allow authenticated users to update their own objects
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

-- Allow authenticated users to delete their own objects
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);
