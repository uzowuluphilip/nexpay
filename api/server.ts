import express, { Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envFile = fs.readFileSync(envPath, 'utf-8')
const envLines = envFile.split('\n')
const env: Record<string, string> = {}

envLines.forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    env[key] = valueParts.join('=')
  }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const app = express()
app.use(cors())
app.use(express.json())

// Verify PIN
app.post('/api/auth/verify-pin', async (req: Request, res: Response) => {
  try {
    const { userId, pin } = req.body

    if (!userId || !pin) {
      return res.status(400).json({ error: 'userId and pin are required' })
    }

    const { data, error } = await supabase
      .from('pins')
      .select('hashed_pin')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return res.status(401).json({ error: 'PIN verification failed' })
    }

    // Simple comparison (in production, use proper hash comparison)
    const isValid = data.hashed_pin === pin

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    res.json({ success: true, message: 'PIN verified' })
  } catch (error) {
    console.error('PIN verification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create profile (bypasses RLS using service role)
app.post('/api/auth/create-profile', async (req: Request, res: Response) => {
  try {
    const { userId, email, fullName } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' })
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName || '',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Profile creation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Deposit endpoint
app.post('/api/wallet/deposit', async (req: Request, res: Response) => {
  try {
    const { userId, amount, description } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' })
    }

    // Create transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'deposit',
          amount,
          description: description || 'Deposit',
          status: 'completed',
        },
      ])
      .select()

    if (error) throw error

    res.json({ success: true, transaction: data?.[0] })
  } catch (error) {
    console.error('Deposit error:', error)
    res.status(500).json({ error: 'Deposit failed' })
  }
})

// Withdraw endpoint
app.post('/api/wallet/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, amount, description } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' })
    }

    // Create transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'withdraw',
          amount,
          description: description || 'Withdrawal',
          status: 'completed',
        },
      ])
      .select()

    if (error) throw error

    res.json({ success: true, transaction: data?.[0] })
  } catch (error) {
    console.error('Withdraw error:', error)
    res.status(500).json({ error: 'Withdrawal failed' })
  }
})

// Send (transfer) endpoint
app.post('/api/wallet/send', async (req: Request, res: Response) => {
  try {
    const { userId, recipientEmail, amount, description } = req.body

    if (!userId || !recipientEmail || !amount) {
      return res.status(400).json({ error: 'userId, recipientEmail, and amount are required' })
    }

    // Find recipient by email
    const { data: recipientData, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', recipientEmail)
      .single()

    if (recipientError || !recipientData) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    const recipientId = recipientData.id

    if (userId === recipientId) {
      return res.status(400).json({ error: 'Cannot send money to yourself' })
    }

    // Create send transaction for sender
    const { data: sendTx, error: sendError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'send',
          amount,
          counterparty_user_id: recipientId,
          description: description || `Sent to ${recipientEmail}`,
          status: 'completed',
        },
      ])
      .select()

    if (sendError) throw sendError

    // Create receive transaction for recipient
    const { data: receiveTx, error: receiveError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: recipientId,
          type: 'receive',
          amount,
          counterparty_user_id: userId,
          description: description || `Received from transaction`,
          status: 'completed',
        },
      ])
      .select()

    if (receiveError) throw receiveError

    res.json({ success: true, sendTransaction: sendTx?.[0], receiveTransaction: receiveTx?.[0] })
  } catch (error) {
    console.error('Send error:', error)
    res.status(500).json({ error: 'Transfer failed' })
  }
})

// Create Savings Plan endpoint
app.post('/api/savings/create-plan', async (req: Request, res: Response) => {
  try {
    const { userId, amount, planType } = req.body

    if (!userId || !amount || !planType) {
      return res.status(400).json({ error: 'userId, amount, and planType are required' })
    }

    // Interest rates for different plan types
    const interestRates: Record<string, number> = {
      '7d': 5,
      '30d': 10,
      '90d': 15,
      '180d': 25,
    }

    // Lock period in days
    const lockPeriods: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
    }

    const interestRate = interestRates[planType]
    const lockPeriodDays = lockPeriods[planType]

    if (!interestRate) {
      return res.status(400).json({ error: 'Invalid plan type' })
    }

    const now = new Date()
    const unlockDate = new Date(now.getTime() + lockPeriodDays * 24 * 60 * 60 * 1000)
    const payoutAmount = amount * (1 + interestRate / 100)

    // Create savings plan
    const { data, error } = await supabase
      .from('savings_plans')
      .insert([
        {
          user_id: userId,
          plan_type: planType,
          amount,
          interest_rate: interestRate,
          start_date: now.toISOString(),
          unlock_date: unlockDate.toISOString(),
          payout_amount: payoutAmount,
          status: 'active',
        },
      ])
      .select()

    if (error) throw error

    res.json({ success: true, plan: data?.[0] })
  } catch (error) {
    console.error('Create plan error:', error)
    res.status(500).json({ error: 'Failed to create savings plan' })
  }
})

// Unlock Savings Plan endpoint
app.post('/api/savings/unlock-plan', async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId and planId are required' })
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('savings_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    if (plan.status !== 'active') {
      return res.status(400).json({ error: 'Plan is not active' })
    }

    // Update plan status
    const { data: updatedPlan, error: updateError } = await supabase
      .from('savings_plans')
      .update({ status: 'withdrawn' })
      .eq('id', planId)
      .select()

    if (updateError) throw updateError

    // Create interest payout transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'savings_payout',
          amount: plan.payout_amount,
          description: `Savings plan ${plan.plan_type} matured and withdrawn`,
          status: 'completed',
        },
      ])
      .select()

    if (txError) throw txError

    res.json({ success: true, plan: updatedPlan?.[0], transaction: tx?.[0] })
  } catch (error) {
    console.error('Unlock plan error:', error)
    res.status(500).json({ error: 'Failed to unlock savings plan' })
  }
})

// Buy Investment endpoint
app.post('/api/investments/buy', async (req: Request, res: Response) => {
  try {
    const { userId, assetId, quantity, price } = req.body

    if (!userId || !assetId || !quantity || !price) {
      return res.status(400).json({ error: 'userId, assetId, quantity, and price are required' })
    }

    const totalCost = quantity * price

    // Create investment holding
    const { data: holding, error: holdingError } = await supabase
      .from('investment_holdings')
      .insert([
        {
          user_id: userId,
          asset_id: assetId,
          quantity,
          entry_price: price,
        },
      ])
      .select()

    if (holdingError) throw holdingError

    // Create investment transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'invest_buy',
          amount: totalCost,
          description: `Bought ${quantity} units at ${price}`,
          status: 'completed',
        },
      ])
      .select()

    if (txError) throw txError

    res.json({ success: true, holding: holding?.[0], transaction: tx?.[0] })
  } catch (error) {
    console.error('Buy investment error:', error)
    res.status(500).json({ error: 'Failed to buy investment' })
  }
})

// Sell Investment endpoint
app.post('/api/investments/sell', async (req: Request, res: Response) => {
  try {
    const { userId, holdingId, quantity, price } = req.body

    if (!userId || !holdingId || !quantity || !price) {
      return res.status(400).json({ error: 'userId, holdingId, quantity, and price are required' })
    }

    const proceeds = quantity * price

    // Get current holding
    const { data: holding, error: getError } = await supabase
      .from('investment_holdings')
      .select('*')
      .eq('id', holdingId)
      .eq('user_id', userId)
      .single()

    if (getError || !holding) {
      return res.status(404).json({ error: 'Holding not found' })
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity to sell' })
    }

    // Update holding quantity
    const newQuantity = holding.quantity - quantity
    const { error: updateError } = await supabase
      .from('investment_holdings')
      .update({ quantity: newQuantity })
      .eq('id', holdingId)

    if (updateError) throw updateError

    // Create sell transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'invest_sell',
          amount: proceeds,
          description: `Sold ${quantity} units at ${price}`,
          status: 'completed',
        },
      ])
      .select()

    if (txError) throw txError

    res.json({ success: true, transaction: tx?.[0] })
  } catch (error) {
    console.error('Sell investment error:', error)
    res.status(500).json({ error: 'Failed to sell investment' })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`)
})
