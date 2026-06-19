-- Create a helper function to bypass RLS for profile creation
CREATE OR REPLACE FUNCTION create_user_profile(
  p_id UUID,
  p_email TEXT,
  p_full_name TEXT
) RETURNS profiles AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (p_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE
  SET email = p_email, full_name = p_full_name
  RETURNING *;
  
  RETURN (SELECT * FROM profiles WHERE id = p_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated, anon;
