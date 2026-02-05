-- Admin Privileges for Profiles and Storage

-- 1. Profiles: Allow Admins to update any profile
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

CREATE POLICY "Allow users to update own profile or admins update any"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. Storage: Allow Admins to manage all objects in certain buckets
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

CREATE POLICY "Allow admins or owners to update objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    auth.uid() = owner 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Allow admins or owners to delete objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    auth.uid() = owner 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Note: For INSERT, we keep it as authenticated for now since it's hard to check "admin" 
-- before the row exists if the bucket is public, but let's refine it to allow Admins 
-- to insert for others if needed.
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
CREATE POLICY "Allow admins or owners to upload objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('family-os', 'avatar')
    AND (
        auth.uid() = owner 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);
