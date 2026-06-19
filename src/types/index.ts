// Transaction types
export type TransactionType = 
  | 'deposit'
  | 'withdraw'
  | 'send'
  | 'receive'
  | 'invest_buy'
  | 'invest_sell'
  | 'interest'
  | 'savings_payout'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  status: TransactionStatus
  description?: string
  counterparty_user_id?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

// Savings plan types
export type PlanType = '7d' | '30d' | '90d' | '180d'
export type SavingsPlanStatus = 'active' | 'matured' | 'withdrawn' | 'cancelled'

export interface SavingsPlan {
  id: string
  user_id: string
  plan_type: PlanType
  amount: number
  interest_rate: number
  start_date: string
  unlock_date: string
  status: SavingsPlanStatus
  payout_amount?: number
  created_at: string
  updated_at: string
}

// Market asset types
export interface MarketAsset {
  id: string
  symbol: string
  name: string
  current_price: number
  updated_at: string
  created_at: string
}

// Investment holding types
export interface InvestmentHolding {
  id: string
  user_id: string
  asset_id: string
  quantity: number
  entry_price: number
  created_at: string
  updated_at: string
  // Computed fields (not in DB)
  asset?: MarketAsset
  current_value?: number
  unrealized_pl?: number
  unrealized_pl_percent?: number
}

// User profile
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  account_number?: string
  created_at: string
  updated_at: string
}

// Balance snapshot
export interface BalanceSnapshot {
  id: string
  user_id: string
  balance: number
  recorded_at: string
  created_at: string
}

// Aggregated user data
export interface UserBalance {
  total_balance: number
  available_balance: number
  locked_in_savings: number
  invested_amount: number
  net_worth: number
}

export interface UserStats {
  total_profit: number
  net_invested: number
  deposit_count: number
  rewards_earned: number
}
