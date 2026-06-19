import type { Transaction, SavingsPlan, InvestmentHolding, MarketAsset } from '@/types'

/**
 * Calculate total balance from transactions
 * Total = deposits + receives + interest + savings payouts + investment sells
 *       - withdrawals - sends - investment buys
 */
export function calculateTotalBalance(transactions: Transaction[]): number {
  if (!transactions.length) return 0

  const incomingTypes = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
  const outgoingTypes = ['withdraw', 'send', 'invest_buy']

  const incoming = transactions
    .filter(t => incomingTypes.includes(t.type) && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const outgoing = transactions
    .filter(t => outgoingTypes.includes(t.type) && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  return incoming - outgoing
}

/**
 * Calculate amount locked in active savings plans
 */
export function calculateLockedInSavings(plans: SavingsPlan[]): number {
  return plans
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Calculate total invested amount (market value)
 */
export function calculateInvestedAmount(holdings: InvestmentHolding[]): number {
  return holdings.reduce((sum, h) => sum + (h.current_value || 0), 0)
}

/**
 * Calculate available balance
 * Available = Total Balance - Locked in Savings
 */
export function calculateAvailableBalance(
  totalBalance: number,
  lockedInSavings: number
): number {
  return Math.max(0, totalBalance - lockedInSavings)
}

/**
 * Calculate net worth
 * Net Worth = Available Balance + Locked in Savings + Invested Amount
 * (Or simply: Total Balance + Invested Amount)
 */
export function calculateNetWorth(
  totalBalance: number,
  investedAmount: number
): number {
  return totalBalance + investedAmount
}

/**
 * Calculate unrealized profit/loss from investments
 */
export function calculateUnrealizedPL(holdings: InvestmentHolding[]): number {
  return holdings.reduce((sum, h) => sum + (h.unrealized_pl || 0), 0)
}

/**
 * Check if a savings plan is matured
 */
export function isSavingsPlanMatured(plan: SavingsPlan): boolean {
  const unlockTime = new Date(plan.unlock_date).getTime()
  const nowTime = Date.now()
  return nowTime >= unlockTime
}

/**
 * Calculate payout amount for a savings plan
 * Using simple interest: Principal × (1 + Rate/100)
 */
export function calculateSavingsPayout(
  principal: number,
  interestRate: number
): number {
  return principal * (1 + interestRate / 100)
}

/**
 * Get interest rate for a plan type
 */
export function getInterestRateForPlanType(planType: string): number {
  const rates: Record<string, number> = {
    '7d': 2,
    '30d': 5,
    '90d': 8,
    '180d': 12,
  }
  return rates[planType] || 0
}

/**
 * Get lock period in days for a plan type
 */
export function getLockPeriodDays(planType: string): number {
  const periods: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
  }
  return periods[planType] || 0
}

/**
 * Calculate the unlock date for a savings plan
 */
export function calculateUnlockDate(startDate: Date, planType: string): Date {
  const days = getLockPeriodDays(planType)
  const unlockDate = new Date(startDate)
  unlockDate.setDate(unlockDate.getDate() + days)
  return unlockDate
}

/**
 * Format currency with 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Format currency with symbol
 */
export function formatCurrencyDisplay(amount: number, symbol = '$'): string {
  return `${symbol}${formatCurrency(amount)}`
}

/**
 * Calculate investment holding current value and P&L
 */
export function enrichInvestmentHolding(
  holding: InvestmentHolding,
  asset: MarketAsset
): InvestmentHolding {
  const currentValue = holding.quantity * asset.current_price
  const entryValue = holding.quantity * holding.entry_price
  const unrealizedPL = currentValue - entryValue
  const unrealizedPLPercent = entryValue > 0 ? (unrealizedPL / entryValue) * 100 : 0

  return {
    ...holding,
    asset,
    current_value: currentValue,
    unrealized_pl: unrealizedPL,
    unrealized_pl_percent: unrealizedPLPercent,
  }
}

/**
 * Get days remaining until a savings plan unlocks
 */
export function getDaysUntilUnlock(unlockDate: string): number {
  const unlock = new Date(unlockDate).getTime()
  const now = Date.now()
  const daysRemaining = Math.ceil((unlock - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, daysRemaining)
}

/**
 * Get color for P&L percentage
 */
export function getPLColor(percent: number): string {
  if (percent > 0) return 'text-green-500'
  if (percent < 0) return 'text-red-500'
  return 'text-gray-500'
}

/**
 * Format percentage
 */
export function formatPercent(percent: number, decimals = 2): string {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(decimals)}%`
}
