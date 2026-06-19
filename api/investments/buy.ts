import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface BuyInvestmentRequest {
  asset_id: string
  quantity: number
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

    const { asset_id, quantity, pin } = req.body as BuyInvestmentRequest

    if (!asset_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid asset or quantity' })
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

    // Get asset details
    const { data: asset, error: assetError } = await supabase
      .from('market_assets')
      .select('*')
      .eq('id', asset_id)
      .single()

    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const totalCost = quantity * asset.current_price

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
    if (totalBalance < totalCost) {
      return res.status(400).json({
        error: 'Insufficient funds',
        available: totalBalance,
        required: totalCost,
      })
    }

    // Check if user already has this asset
    const { data: existing } = await supabase
      .from('investment_holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('asset_id', asset_id)
      .single()

    let holding
    let holdingError

    if (existing) {
      // Update existing holding with weighted average price
      const newQuantity = existing.quantity + quantity
      const newEntryPrice =
        (existing.quantity * existing.entry_price + quantity * asset.current_price) / newQuantity

      const result = await supabase
        .from('investment_holdings')
        .update({
          quantity: newQuantity,
          entry_price: newEntryPrice,
        })
        .eq('id', existing.id)
        .select()
        .single()

      holding = result.data
      holdingError = result.error
    } else {
      // Create new holding
      const result = await supabase
        .from('investment_holdings')
        .insert([
          {
            user_id: user.id,
            asset_id,
            quantity,
            entry_price: asset.current_price,
          },
        ])
        .select()
        .single()

      holding = result.data
      holdingError = result.error
    }

    if (holdingError) {
      return res.status(500).json({ error: 'Failed to create/update holding' })
    }

    // Create invest_buy transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'invest_buy',
          amount: totalCost,
          status: 'completed',
          description: `Bought ${quantity} of ${asset.symbol}`,
          metadata: { asset_id, quantity, asset_symbol: asset.symbol },
        },
      ])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ error: 'Failed to create transaction' })
    }

    const newBalance = totalBalance - totalCost

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
      holding,
      balance: newBalance,
      message: `Successfully purchased ${quantity} shares of ${asset.symbol}`,
    })
  } catch (error) {
    console.error('Buy investment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
