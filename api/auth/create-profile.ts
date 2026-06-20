import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl) {
  console.error('[create-profile] ✗ VITE_SUPABASE_URL is not set')
}
if (!supabaseKey) {
  console.error('[create-profile] ✗ SUPABASE_SERVICE_ROLE_KEY is not set - set this in Vercel Environment Variables!')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: any, res: any) {
  console.log('[create-profile] Request method:', req.method)
  console.log('[create-profile] Request body:', JSON.stringify(req.body))

  if (req.method !== 'POST') {
    console.log('[create-profile] ✗ Method not allowed')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, email, fullName } = req.body

    if (!userId || !email) {
      console.log('[create-profile] ✗ Missing userId or email')
      return res.status(400).json({ error: 'userId and email are required' })
    }

    console.log('[create-profile] Creating profile for user:', userId)
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
      console.error('[create-profile] ✗ Supabase error:', error.message, error.code)
      // Check if profile already exists
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('[create-profile] ✓ Profile already exists (duplicate key)')
        return res.status(200).json({ success: true, message: 'Profile already exists' })
      }
      return res.status(400).json({ error: error.message })
    }

    console.log('[create-profile] ✓ Profile created successfully')
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('[create-profile] ✗ Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
