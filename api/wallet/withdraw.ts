import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface WithdrawRequest {
  amount: number
  pin: string
  description?: string
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { amount, pin, description } = req.body as WithdrawRequest

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Invalid PIN' })
    }

    // Verify PIN
    const { data: pinRecord, error: pinError } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (pinError || !pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    // Get current balance
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const totalBalance = transactions?.reduce((sum, t) => {
      const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
      const outgoingTypes = ['withdraw', 'send', 'invest_buy']
      if (incomingTypes.includes(t.type)) return sum + t.amount
      if (outgoingTypes.includes(t.type)) return sum - t.amount
      return sum
    }, 0) || 0

    // Check sufficient funds
    if (totalBalance < amount) {
      return res.status(400).json({ error: 'Insufficient funds', available: totalBalance })
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'withdraw',
          amount: parseFloat(amount.toString()),
          status: 'completed',
          description: description || 'Withdrawal from Nex Pay',
        },
      ])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ error: 'Failed to create transaction' })
    }

    // Calculate new balance
    const newBalance = totalBalance - amount

    // Create balance snapshot
    await supabase.from('balance_snapshots').insert([
      {
        user_id: user.id,
        balance: newBalance,
        recorded_at: new Date().toISOString(),
      },
    ])

    res.status(200).json({
      success: true,
      transaction,
      balance: newBalance,
    })
  } catch (error) {
    console.error('Withdraw error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
