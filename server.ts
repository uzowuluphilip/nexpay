import 'dotenv/config.js'
import * as fs from 'fs'
import * as path from 'path'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach((line) => {
  const [key, value] = line.split('=')
  if (key && !process.env[key]) {
    process.env[key] = value?.trim()
  }
})

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Helper function to get user from auth token
async function getUser(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')
  return user
}

// Helper to calculate balance
async function calculateBalance(userId: string) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')

  return transactions?.reduce((sum, t) => {
    const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
    const outgoingTypes = ['withdraw', 'send', 'invest_buy']
    if (incomingTypes.includes(t.type)) return sum + t.amount
    if (outgoingTypes.includes(t.type)) return sum - t.amount
    return sum
  }, 0) || 0
}

// === WALLET ENDPOINTS ===

// POST /api/wallet/deposit
app.post('/api/wallet/deposit', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { amount, description } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'deposit',
          amount: parseFloat(amount.toString()),
          status: 'completed',
          description: description || 'Deposit via Nex Pay',
        },
      ])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ error: 'Failed to create transaction' })
    }

    const balance = await calculateBalance(user.id)

    await supabase.from('balance_snapshots').insert([
      {
        user_id: user.id,
        balance,
        recorded_at: new Date().toISOString(),
      },
    ])

    res.json({ success: true, transaction, balance })
  } catch (error) {
    console.error('Deposit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/wallet/withdraw
app.post('/api/wallet/withdraw', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { amount, pin, description } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Verify PIN
    const { data: pinRecord } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const currentBalance = await calculateBalance(user.id)

    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient funds', available: currentBalance })
    }

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

    const newBalance = currentBalance - amount

    await supabase.from('balance_snapshots').insert([
      {
        user_id: user.id,
        balance: newBalance,
        recorded_at: new Date().toISOString(),
      },
    ])

    res.json({ success: true, transaction, balance: newBalance })
  } catch (error) {
    console.error('Withdraw error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/wallet/send
app.post('/api/wallet/send', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { recipient_email, amount, pin, description } = req.body

    if (!recipient_email || recipient_email === user.email) {
      return res.status(400).json({ error: 'Invalid recipient' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Verify PIN
    const { data: pinRecord } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    // Find recipient
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()
    const recipient = allUsers?.find((u) => u.email === recipient_email)

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    const currentBalance = await calculateBalance(user.id)

    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient funds', available: currentBalance })
    }

    // Create send and receive transactions
    const { data: sendTx } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'send',
          amount,
          status: 'completed',
          description: description || `Sent to ${recipient_email}`,
          counterparty_user_id: recipient.id,
        },
      ])
      .select()
      .single()

    await supabase
      .from('transactions')
      .insert([
        {
          user_id: recipient.id,
          type: 'receive',
          amount,
          status: 'completed',
          description: description || `Received from ${user.email}`,
          counterparty_user_id: user.id,
        },
      ])

    const newBalance = currentBalance - amount
    const recipientBalance = (await calculateBalance(recipient.id)) + amount

    await supabase.from('balance_snapshots').insert([
      { user_id: user.id, balance: newBalance, recorded_at: new Date().toISOString() },
      { user_id: recipient.id, balance: recipientBalance, recorded_at: new Date().toISOString() },
    ])

    res.json({ success: true, transaction: sendTx, balance: newBalance })
  } catch (error) {
    console.error('Send error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// === SAVINGS ENDPOINTS ===

// POST /api/savings/create-plan
app.post('/api/savings/create-plan', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { amount, plan_type, pin } = req.body

    if (!amount || amount <= 0 || !['7d', '30d', '90d', '180d'].includes(plan_type)) {
      return res.status(400).json({ error: 'Invalid parameters' })
    }

    // Verify PIN
    const { data: pinRecord } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const currentBalance = await calculateBalance(user.id)

    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient funds', available: currentBalance })
    }

    const interestRates: Record<string, number> = { '7d': 5, '30d': 10, '90d': 15, '180d': 25 }
    const daysDuration: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 }

    const interestRate = interestRates[plan_type]
    const startDate = new Date()
    const unlockDate = new Date(startDate.getTime() + daysDuration[plan_type] * 24 * 60 * 60 * 1000)
    const payoutAmount = amount * (1 + interestRate / 100)

    const { data: plan } = await supabase
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

    res.json({ success: true, plan, message: `Plan created. Unlock: ${unlockDate.toLocaleDateString()}` })
  } catch (error) {
    console.error('Create savings plan error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// === INVESTMENT ENDPOINTS ===

// POST /api/investments/buy
app.post('/api/investments/buy', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { asset_id, quantity, pin } = req.body

    if (!asset_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' })
    }

    // Verify PIN
    const { data: pinRecord } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const { data: asset } = await supabase
      .from('market_assets')
      .select('*')
      .eq('id', asset_id)
      .single()

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const totalCost = quantity * asset.current_price
    const currentBalance = await calculateBalance(user.id)

    if (currentBalance < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds', available: currentBalance })
    }

    // Check existing holding
    const { data: existing } = await supabase
      .from('investment_holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('asset_id', asset_id)
      .single()

    let holding
    if (existing) {
      const newQuantity = existing.quantity + quantity
      const newPrice = (existing.quantity * existing.entry_price + quantity * asset.current_price) / newQuantity
      const { data } = await supabase
        .from('investment_holdings')
        .update({ quantity: newQuantity, entry_price: newPrice })
        .eq('id', existing.id)
        .select()
        .single()
      holding = data
    } else {
      const { data } = await supabase
        .from('investment_holdings')
        .insert([{ user_id: user.id, asset_id, quantity, entry_price: asset.current_price }])
        .select()
        .single()
      holding = data
    }

    await supabase
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

    const newBalance = currentBalance - totalCost

    await supabase.from('balance_snapshots').insert([
      { user_id: user.id, balance: newBalance, recorded_at: new Date().toISOString() },
    ])

    res.json({ success: true, holding, balance: newBalance })
  } catch (error) {
    console.error('Buy investment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/investments/sell
app.post('/api/investments/sell', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = await getUser(token)
    const { holding_id, quantity, current_price, pin } = req.body

    if (!holding_id || !quantity || quantity <= 0 || !current_price || current_price <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' })
    }

    // Verify PIN
    const { data: pinRecord } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!pinRecord || pinRecord.hashed_pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const { data: holding } = await supabase
      .from('investment_holdings')
      .select('*')
      .eq('id', holding_id)
      .eq('user_id', user.id)
      .single()

    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' })
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient shares', available: holding.quantity })
    }

    const proceedsAmount = quantity * current_price
    const costBasis = quantity * holding.entry_price
    const pnl = proceedsAmount - costBasis

    const remainingQuantity = holding.quantity - quantity

    if (remainingQuantity <= 0) {
      await supabase.from('investment_holdings').delete().eq('id', holding_id)
    } else {
      await supabase
        .from('investment_holdings')
        .update({ quantity: remainingQuantity })
        .eq('id', holding_id)
    }

    const { data: asset } = await supabase
      .from('market_assets')
      .select('*')
      .eq('id', holding.asset_id)
      .single()

    await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'invest_sell',
          amount: proceedsAmount,
          status: 'completed',
          description: `Sold ${quantity} of ${asset?.symbol} (P&L: ${pnl.toFixed(2)})`,
          metadata: { asset_id: holding.asset_id, quantity, sell_price: current_price, pnl },
        },
      ])

    const currentBalance = await calculateBalance(user.id)
    const newBalance = currentBalance + proceedsAmount

    await supabase.from('balance_snapshots').insert([
      { user_id: user.id, balance: newBalance, recorded_at: new Date().toISOString() },
    ])

    res.json({ success: true, balance: newBalance, pnl })
  } catch (error) {
    console.error('Sell investment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
