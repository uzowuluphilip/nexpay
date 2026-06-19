import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface CreateSavingsPlanRequest {
  amount: number
  plan_type: '7d' | '30d' | '90d' | '180d'
  pin: string
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

    const { amount, plan_type, pin } = req.body as CreateSavingsPlanRequest

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    if (!plan_type || !['7d', '30d', '90d', '180d'].includes(plan_type)) {
      return res.status(400).json({ error: 'Invalid plan type' })
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

    // Calculate interest rate and unlock date based on plan type
    const interestRates: Record<string, number> = {
      '7d': 0.05,
      '30d': 0.10,
      '90d': 0.15,
      '180d': 0.25,
    }

    const daysDuration: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
    }

    const interestRate = interestRates[plan_type]
    const startDate = new Date()
    const unlockDate = new Date(startDate.getTime() + daysDuration[plan_type] * 24 * 60 * 60 * 1000)
    const payoutAmount = amount * (1 + interestRate / 100)

    // Create savings plan
    const { data: plan, error: planError } = await supabase
      .from('savings_plans')
      .insert([
        {
          user_id: user.id,
          amount,
          plan_type,
          interest_rate: interestRate,
          start_date: startDate.toISOString(),
          unlock_date: unlockDate.toISOString(),
          status: 'active',
          payout_amount: payoutAmount,
        },
      ])
      .select()
      .single()

    if (planError) {
      return res.status(500).json({ error: 'Failed to create savings plan' })
    }

    res.status(200).json({
      success: true,
      plan,
      message: `Savings plan created. Unlock date: ${unlockDate.toLocaleDateString()}`,
    })
  } catch (error) {
    console.error('Create savings plan error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
