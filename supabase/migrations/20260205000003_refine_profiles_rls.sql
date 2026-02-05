-- Refine Profiles RLS Policies

-- Drop the broad policy if it exists (using a name that matches what might have been created)
DROP POLICY IF EXISTS "Enable All Access for Authenticated Users" ON public.profiles;

-- Allow authenticated users to view all profiles
CREATE POLICY "Allow authenticated read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update ONLY their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (if not using triggers)
CREATE POLICY "Allow users to insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
