import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import type { Transaction, SavingsPlan, InvestmentHolding, BalanceSnapshot, UserProfile, MarketAsset } from '@/types'

// Get current user's transactions
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('Not authenticated for transactions query')
          return []
        }

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Transactions query error:', error)
          return [] // Return empty array on error instead of throwing
        }
        return data as Transaction[]
      } catch (err) {
        console.error('Transactions fetch exception:', err)
        return [] // Return empty array on exception
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })
}

// Get savings plans
export function useSavingsPlans() {
  return useQuery({
    queryKey: ['savings_plans'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('Not authenticated for savings plans query')
          return []
        }

        const { data, error } = await supabase
          .from('savings_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Savings plans query error:', error)
          return [] // Return empty array on error instead of throwing
        }
        return data as SavingsPlan[]
      } catch (err) {
        console.error('Savings plans fetch exception:', err)
        return [] // Return empty array on exception
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })
}

// Get investment holdings
export function useInvestmentHoldings() {
  return useQuery({
    queryKey: ['investment_holdings'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('Not authenticated for investment holdings query')
          return []
        }

        const { data, error } = await supabase
          .from('investment_holdings')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Investment holdings query error:', error)
          return [] // Return empty array on error instead of throwing
        }
        return data as InvestmentHolding[]
      } catch (err) {
        console.error('Investment holdings fetch exception:', err)
        return [] // Return empty array on exception
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })
}

// Get market assets
export function useMarketAssets() {
  return useQuery({
    queryKey: ['market_assets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('market_assets')
          .select('*')
          .order('symbol', { ascending: true })

        if (error) {
          console.error('Market assets query error:', error)
          return [] // Return empty array on error instead of throwing
        }
        return data as MarketAsset[]
      } catch (err) {
        console.error('Market assets fetch exception:', err)
        return [] // Return empty array on exception
      }
    },
    retry: 1,
    staleTime: 60000, // 60 seconds - market data can be cached longer
  })
}

// Get balance snapshots for charting
export function useBalanceSnapshots(days = 90) {
  return useQuery({
    queryKey: ['balance_snapshots', days],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('Not authenticated for balance snapshots query')
          return []
        }

        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)

        const { data, error } = await supabase
          .from('balance_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .gte('recorded_at', fromDate.toISOString())
          .order('recorded_at', { ascending: true })

        if (error) {
          console.error('Balance snapshots query error:', error)
          return [] // Return empty array on error instead of throwing
        }
        return data as BalanceSnapshot[]
      } catch (err) {
        console.error('Balance snapshots fetch exception:', err)
        return [] // Return empty array on exception
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })
}

// Get user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('Not authenticated for profile query')
          throw new Error('Not authenticated')
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Profile query error:', error)
          throw error
        }
        
        let profile = data as UserProfile
        
        // Generate account number if it doesn't exist
        if (!profile.account_number) {
          try {
            const accountNumber = String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({ account_number: accountNumber })
              .eq('id', user.id)
              .select()
              .single()
            
            if (!updateError && updatedProfile) {
              profile = updatedProfile as UserProfile
            }
          } catch (updateErr) {
            console.error('Failed to generate account number:', updateErr)
            // Continue without updating - not critical
          }
        }
        
        return profile
      } catch (err) {
        console.error('Profile fetch exception:', err)
        throw err
      }
    },
    retry: 1,
    staleTime: 60000, // 60 seconds
  })
}

// Create transaction (for deposits, withdrawals, etc.)
export function useCreateTransaction() {
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as Transaction
    },
  })
}

// Create savings plan
export function useCreateSavingsPlan() {
  return useMutation({
    mutationFn: async (plan: Omit<SavingsPlan, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('savings_plans')
        .insert([
          {
            ...plan,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as SavingsPlan
    },
  })
}

// Update savings plan status
export function useUpdateSavingsPlan() {
  return useMutation({
    mutationFn: async ({
      id,
      status,
      payout_amount,
    }: {
      id: string
      status: string
      payout_amount?: number
    }) => {
      const { data, error } = await supabase
        .from('savings_plans')
        .update({ status, payout_amount })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SavingsPlan
    },
  })
}

// Buy investment
export function useBuyInvestment() {
  return useMutation({
    mutationFn: async ({
      asset_id,
      quantity,
      entry_price,
    }: {
      asset_id: string
      quantity: number
      entry_price: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user already has this asset
      const { data: existing } = await supabase
        .from('investment_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_id', asset_id)
        .single()

      if (existing) {
        // Update existing holding with weighted average price
        const newQuantity = existing.quantity + quantity
        const newEntryPrice =
          (existing.quantity * existing.entry_price + quantity * entry_price) /
          newQuantity

        const { data, error } = await supabase
          .from('investment_holdings')
          .update({
            quantity: newQuantity,
            entry_price: newEntryPrice,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as InvestmentHolding
      } else {
        // Create new holding
        const { data, error } = await supabase
          .from('investment_holdings')
          .insert([
            {
              user_id: user.id,
              asset_id,
              quantity,
              entry_price,
            },
          ])
          .select()
          .single()

        if (error) throw error
        return data as InvestmentHolding
      }
    },
  })
}

// Sell investment
export function useSellInvestment() {
  return useMutation({
    mutationFn: async ({
      holding_id,
      quantity,
    }: {
      holding_id: string
      quantity: number
    }) => {
      const { data: holding, error: fetchError } = await supabase
        .from('investment_holdings')
        .select('*')
        .eq('id', holding_id)
        .single()

      if (fetchError) throw fetchError

      const remainingQuantity = holding.quantity - quantity

      if (remainingQuantity <= 0) {
        // Delete the holding if all units are sold
        const { error } = await supabase
          .from('investment_holdings')
          .delete()
          .eq('id', holding_id)

        if (error) throw error
        return null
      } else {
        // Update quantity
        const { data, error } = await supabase
          .from('investment_holdings')
          .update({ quantity: remainingQuantity })
          .eq('id', holding_id)
          .select()
          .single()

        if (error) throw error
        return data as InvestmentHolding
      }
    },
  })
}
