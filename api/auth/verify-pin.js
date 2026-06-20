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

    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    // Get user's PIN from database
    const { data: pinRecord, error: pinError } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (pinError || !pinRecord) {
      return res.status(404).json({ error: 'PIN not found' });
    }

    // Simple plaintext comparison (in production, use bcrypt)
    // TODO: Implement bcrypt hashing for PIN storage
    const pinMatches = pinRecord.hashed_pin === pin;

    if (!pinMatches) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
