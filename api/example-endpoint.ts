// Template for Vercel Serverless Functions
// This shows the pattern for creating secure backend endpoints

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client (with service role key)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

/**
 * Example endpoint: /api/wallet/deposit
 * 
 * Flow:
 * 1. Client sends request with user auth token and amount
 * 2. Server validates token and amount
 * 3. Server creates transaction in database
 * 4. Server returns confirmation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const token = authHeader.slice(7)

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get request body
    const { amount, description } = req.body

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Create transaction record
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type: 'deposit',
          amount: parseFloat(amount),
          status: 'completed',
          description: description || 'Deposit via Nex Pay',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Transaction creation error:', error)
      return res.status(500).json({ error: 'Failed to create transaction' })
    }

    // Create balance snapshot for charting
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

    await supabase
      .from('balance_snapshots')
      .insert([
        {
          user_id: user.id,
          balance: totalBalance,
          recorded_at: new Date().toISOString(),
        },
      ])

    // Return success response
    return res.status(200).json({
      success: true,
      transaction: data,
      balance: totalBalance,
    })
  } catch (error) {
    console.error('Endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Key Security Practices:
 * 
 * 1. Token Validation
 *    - Always validate the auth token
 *    - Use Supabase admin client with service role key server-side
 *    - Never trust client-side auth claims
 * 
 * 2. Data Validation
 *    - Validate all input values
 *    - Check types, ranges, and formats
 *    - Reject invalid data early
 * 
 * 3. Error Handling
 *    - Don't expose internal errors to client
 *    - Log errors server-side for debugging
 *    - Return generic error messages
 * 
 * 4. Database Operations
 *    - RLS policies enforce data isolation
 *    - Service role bypasses RLS (so be careful!)
 *    - Always use explicit user_id when filtering
 * 
 * 5. Rate Limiting (add in production)
 *    - Prevent abuse with rate limiters
 *    - Use Vercel's built-in rate limiting or a library
 * 
 * Example with bcrypt for PIN:
 * 
 *   import * as bcrypt from 'bcryptjs'
 *   
 *   const pin = req.body.pin
 *   const hashedPin = await bcrypt.hash(pin, 10)
 *   
 *   // Store hashedPin in database
 *   // To verify:
 *   const isValid = await bcrypt.compare(pin, storedHashedPin)
 */
