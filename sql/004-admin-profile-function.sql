-- Create a secure function to insert profiles (bypasses RLS)
-- This function should be created and will allow profile insertion
CREATE OR REPLACE FUNCTION public.create_profile_as_admin(
  p_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS profiles AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (p_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE
  SET email = p_email, full_name = p_full_name
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_profile_as_admin(UUID, TEXT, TEXT) TO anon, authenticated;
