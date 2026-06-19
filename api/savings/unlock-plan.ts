import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface UnlockSavingsPlanRequest {
  plan_id: string
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

    const { plan_id, pin } = req.body as UnlockSavingsPlanRequest

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

    // Get the savings plan
    const { data: plan, error: planError } = await supabase
      .from('savings_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return res.status(404).json({ error: 'Savings plan not found' })
    }

    // Check if plan is matured
    const now = new Date()
    const unlockDate = new Date(plan.unlock_date)

    if (now < unlockDate) {
      const daysRemaining = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return res.status(400).json({
        error: 'Plan is not yet mature',
        daysRemaining,
        unlockDate: unlockDate.toLocaleDateString(),
      })
    }

    if (plan.status !== 'active') {
      return res.status(400).json({ error: 'Plan cannot be unlocked' })
    }

    // Create payout transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'savings_payout',
          amount: plan.payout_amount,
          status: 'completed',
          description: `Savings plan payout (${plan.plan_type})`,
          metadata: { plan_id },
        },
      ])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ error: 'Failed to create payout transaction' })
    }

    // Update plan status to withdrawn
    const { data: updatedPlan, error: updateError } = await supabase
      .from('savings_plans')
      .update({ status: 'withdrawn' })
      .eq('id', plan_id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update plan status' })
    }

    // Get updated balance
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const newBalance = allTransactions?.reduce((sum, t) => {
      const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
      const outgoingTypes = ['withdraw', 'send', 'invest_buy']
      if (incomingTypes.includes(t.type)) return sum + t.amount
      if (outgoingTypes.includes(t.type)) return sum - t.amount
      return sum
    }, 0) || 0

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
      plan: updatedPlan,
      payout_amount: plan.payout_amount,
      balance: newBalance,
      message: `Received ${plan.payout_amount.toFixed(2)} from savings plan`,
    })
  } catch (error) {
    console.error('Unlock savings plan error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
