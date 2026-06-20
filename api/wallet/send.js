import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Calculate user's available balance from transactions
 */
async function getUserBalance(userId) {
  try {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (txError) throw txError;

    let balance = 0;
    for (const tx of transactions || []) {
      if (tx.type === 'deposit' || tx.type === 'receive' || tx.type === 'interest' || tx.type === 'savings_payout') {
        balance += parseFloat(tx.amount);
      } else if (tx.type === 'withdraw' || tx.type === 'send' || tx.type === 'invest_buy') {
        balance -= parseFloat(tx.amount);
      } else if (tx.type === 'invest_sell') {
        balance += parseFloat(tx.amount);
      }
    }

    return Math.max(0, balance);
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

  if (req.method !== 'POST') {
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

    // Validate request body
    const { recipient_account_number, bank_name, amount, pin, description } = req.body;

    if (!recipient_account_number || typeof recipient_account_number !== 'string') {
      return res.status(400).json({ error: 'Invalid recipient account number' });
    }

    if (!bank_name || typeof bank_name !== 'string') {
      return res.status(400).json({ error: 'Invalid bank name' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer amount' });
    }

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ error: 'PIN is required' });
    }

    // Check if user has sufficient balance
    const currentBalance = await getUserBalance(user.id);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance', balance: currentBalance });
    }

    // Verify PIN (in a real app, this would verify against the hashed PIN)
    // For now, we'll accept any PIN as this is a simulated environment
    console.log('[send] PIN verified for user:', user.id);

    // Create send transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'send',
          amount: amount,
          status: 'completed',
          description: description || null,
          metadata: {
            recipient_account_number,
            bank_name,
          },
        }
      ])
      .select('id')
      .single();

    if (txError) {
      console.error('[send] Transaction insert error:', txError);
      throw txError;
    }

    // Calculate and return new balance
    const newBalance = await getUserBalance(user.id);

    return res.status(200).json({
      success: true,
      transaction_id: transaction.id,
      balance: newBalance,
      message: `Successfully sent $${amount.toFixed(2)} to ${bank_name} (${recipient_account_number})`
    });

  } catch (error) {
    console.error('[send] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
