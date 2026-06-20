-- Remove foreign key constraint from profiles table
-- This allows profiles to be created via the API without race conditions

-- Drop the existing constraint by recreating the table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS "profiles_id_fkey";

-- Now the profiles table can accept any UUID without requiring it to exist in auth.users first
-- Supabase auth handles the user lifecycle separately
