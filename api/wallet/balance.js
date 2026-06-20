import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Calculate user's balance breakdown from transactions
 */
async function getUserBalance(userId) {
  try {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (txError) throw txError;

    let available = 0;
    let invested = 0;
    let locked = 0;

    for (const tx of transactions || []) {
      const amt = parseFloat(tx.amount);
      if (tx.type === 'deposit' || tx.type === 'receive' || tx.type === 'interest') {
        available += amt;
      } else if (tx.type === 'withdraw' || tx.type === 'send') {
        available -= amt;
      } else if (tx.type === 'invest_buy') {
        available -= amt;
        invested += amt;
      } else if (tx.type === 'invest_sell') {
        invested -= amt;
        available += amt;
      } else if (tx.type === 'savings_payout') {
        locked -= amt;
        available += amt;
      }
    }

    return {
      available: Math.max(0, available),
      invested: Math.max(0, invested),
      locked: Math.max(0, locked),
      total: Math.max(0, available) + Math.max(0, invested) + Math.max(0, locked),
    };
  } catch (error) {
    console.error('[getUserBalance] Error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get balance breakdown
    const balance = await getUserBalance(user.id);

    return res.status(200).json({
      success: true,
      balance: balance,
    });
  } catch (error) {
    console.error('[balance] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
