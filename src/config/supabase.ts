import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// DEBUG: Log Supabase configuration
console.log('[Supabase Config] URL:', supabaseUrl ? '✓ set' : '✗ missing')
console.log('[Supabase Config] Anon Key:', supabaseAnonKey ? `✓ set (${supabaseAnonKey.substring(0, 30)}...)` : '✗ missing')
console.log('[Supabase Config] Expected key prefix:', 'sb_publishable_')
console.log('[Supabase Config] Actual key prefix:', supabaseAnonKey?.substring(0, 20))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
