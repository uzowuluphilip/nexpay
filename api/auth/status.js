import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if profile exists (using service role to bypass RLS)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // Check if PIN exists (using service role to bypass RLS)
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return res.status(200).json({
      authenticated: true,
      userId: user.id,
      profileExists: !profileError && profile !== null,
      hasCreatedPin: !pinError && pin !== null,
    });
  } catch (error) {
    console.error('[auth-status] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
