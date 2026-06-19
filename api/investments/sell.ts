import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface SellInvestmentRequest {
  holding_id: string
  quantity: number
  current_price: number
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

    const { holding_id, quantity, current_price, pin } = req.body as SellInvestmentRequest

    if (!holding_id || !quantity || quantity <= 0 || !current_price || current_price <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' })
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

    // Get the holding
    const { data: holding, error: holdingError } = await supabase
      .from('investment_holdings')
      .select('*')
      .eq('id', holding_id)
      .eq('user_id', user.id)
      .single()

    if (holdingError || !holding) {
      return res.status(404).json({ error: 'Holding not found' })
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient shares',
        available: holding.quantity,
        requested: quantity,
      })
    }

    const proceedsAmount = quantity * current_price
    const costBasis = quantity * holding.entry_price
    const pnl = proceedsAmount - costBasis

    // Update or delete holding
    let updatedHolding
    let updateError

    const remainingQuantity = holding.quantity - quantity

    if (remainingQuantity <= 0) {
      // Delete the holding if all units are sold
      const result = await supabase
        .from('investment_holdings')
        .delete()
        .eq('id', holding_id)

      updateError = result.error
      updatedHolding = null
    } else {
      // Update quantity
      const result = await supabase
        .from('investment_holdings')
        .update({ quantity: remainingQuantity })
        .eq('id', holding_id)
        .select()
        .single()

      updatedHolding = result.data
      updateError = result.error
    }

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update holding' })
    }

    // Get asset info
    const { data: asset } = await supabase
      .from('market_assets')
      .select('*')
      .eq('id', holding.asset_id)
      .single()

    // Create invest_sell transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'invest_sell',
          amount: proceedsAmount,
          status: 'completed',
          description: `Sold ${quantity} of ${asset?.symbol || 'asset'} (P&L: ${pnl.toFixed(2)})`,
          metadata: {
            asset_id: holding.asset_id,
            quantity,
            sell_price: current_price,
            entry_price: holding.entry_price,
            pnl,
            asset_symbol: asset?.symbol,
          },
        },
      ])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ error: 'Failed to create transaction' })
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
      holding: updatedHolding,
      balance: newBalance,
      pnl,
      message: `Successfully sold ${quantity} shares. P&L: ${pnl.toFixed(2)}`,
    })
  } catch (error) {
    console.error('Sell investment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
