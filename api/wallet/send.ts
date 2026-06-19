import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface SendRequest {
  recipient_email: string
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

    const { recipient_email, amount, pin, description } = req.body as SendRequest

    if (!recipient_email || recipient_email === user.email) {
      return res.status(400).json({ error: 'Invalid recipient' })
    }

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

    // Find recipient by email
    const { data: { users: recipientList }, error: recipientError } = await supabase.auth.admin.listUsers()
    const recipient = recipientList?.find(u => u.email === recipient_email)

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    // Get sender's balance
    const { data: senderTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const senderBalance = senderTransactions?.reduce((sum, t) => {
      const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
      const outgoingTypes = ['withdraw', 'send', 'invest_buy']
      if (incomingTypes.includes(t.type)) return sum + t.amount
      if (outgoingTypes.includes(t.type)) return sum - t.amount
      return sum
    }, 0) || 0

    // Check sufficient funds
    if (senderBalance < amount) {
      return res.status(400).json({ error: 'Insufficient funds', available: senderBalance })
    }

    // Create send transaction for sender
    const { data: sendTransaction, error: sendError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'send',
          amount: parseFloat(amount.toString()),
          status: 'completed',
          description: description || `Sent to ${recipient_email}`,
          counterparty_user_id: recipient.id,
        },
      ])
      .select()
      .single()

    if (sendError) {
      return res.status(500).json({ error: 'Failed to create send transaction' })
    }

    // Create receive transaction for recipient
    const { data: receiveTransaction, error: receiveError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: recipient.id,
          type: 'receive',
          amount: parseFloat(amount.toString()),
          status: 'completed',
          description: description || `Received from ${user.email}`,
          counterparty_user_id: user.id,
        },
      ])
      .select()
      .single()

    if (receiveError) {
      return res.status(500).json({ error: 'Failed to create receive transaction' })
    }

    // Create balance snapshots for both users
    const newSenderBalance = senderBalance - amount

    const { data: recipientTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', recipient.id)
      .eq('status', 'completed')

    const recipientBalance =
      (recipientTransactions?.reduce((sum, t) => {
        const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
        const outgoingTypes = ['withdraw', 'send', 'invest_buy']
        if (incomingTypes.includes(t.type)) return sum + t.amount
        if (outgoingTypes.includes(t.type)) return sum - t.amount
        return sum
      }, 0) || 0) + amount

    await supabase.from('balance_snapshots').insert([
      {
        user_id: user.id,
        balance: newSenderBalance,
        recorded_at: new Date().toISOString(),
      },
      {
        user_id: recipient.id,
        balance: recipientBalance,
        recorded_at: new Date().toISOString(),
      },
    ])

    res.status(200).json({
      success: true,
      transaction: sendTransaction,
      balance: newSenderBalance,
      recipient_id: recipient.id,
    })
  } catch (error) {
    console.error('Send error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
