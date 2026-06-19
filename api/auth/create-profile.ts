import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
}
