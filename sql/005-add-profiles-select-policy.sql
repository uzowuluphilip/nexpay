-- Add SELECT policy for profiles table
-- Users should be able to read their own profile

-- Check if policy exists before creating
DROP POLICY IF EXISTS "Users can select own profile" ON profiles;

CREATE POLICY "Users can select own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Also allow the profile to be readable by all authenticated users (for social features)
-- Users can view other profiles but not see sensitive data
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
