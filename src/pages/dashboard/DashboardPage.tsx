import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDownToLine, ArrowUpFromLine, Send, TrendingUp, Wallet, PieChart, BarChart3, Activity, Copy, Check } from 'lucide-react'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import { PageWrapper, AnimatedContainer } from '@/components/PageWrapper'
import { BalanceCard, StatCard, Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { QuickActions } from '@/components/QuickActions'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { DashboardSkeleton, BalanceCardSkeleton, ListSkeleton } from '@/components/Skeleton'
import { supabase } from '@/config/supabase'
import { containerVariants, cardVariants } from '@/utils/animations'
import { SPACING, ICON_SIZE } from '@/utils/design-constants'
import { useLoadingState } from '@/hooks/useAnimations'
import {
  useTransactions,
  useSavingsPlans,
  useInvestmentHoldings,
  useMarketAssets,
  useBalanceSnapshots,
  useUserProfile,
} from '@/hooks/useData'
import {
  calculateTotalBalance,
  calculateLockedInSavings,
  calculateInvestedAmount,
  calculateAvailableBalance,
  calculateNetWorth,
  formatCurrencyDisplay,
  enrichInvestmentHolding,
} from '@/utils/calculations'


export default function DashboardPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const displayLoading = useLoadingState(isLoading, 300)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login', { replace: true })
        return
      }

      // Check if user has created a PIN
      const { data, error } = await supabase
        .from('pins')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      
      if (error || !data) {
        navigate('/create-pin', { replace: true })
      }
    }
    checkAuth()
  }, [navigate])

  // Data queries
  const { data: profile } = useUserProfile()
  const { data: transactions = [], isLoading: transLoading } = useTransactions()
  const { data: savingsPlans = [] } = useSavingsPlans()
  const { data: holdings = [] } = useInvestmentHoldings()
  const { data: assets = [] } = useMarketAssets()
  const { data: snapshots = [] } = useBalanceSnapshots(90)

  // Update loading state
  useEffect(() => {
    if (!transLoading && profile) {
      setIsLoading(false)
    }
  }, [transLoading, profile])

  // Copy account number to clipboard
  const handleCopyAccountNumber = async () => {
    if (profile?.account_number) {
      await navigator.clipboard.writeText(profile.account_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Calculate balances
  const totalBalance = calculateTotalBalance(transactions)
  const lockedInSavings = calculateLockedInSavings(savingsPlans)
  const availableBalance = calculateAvailableBalance(totalBalance, lockedInSavings)

  // Enrich holdings with market data
  const enrichedHoldings = holdings.map(h => {
    const asset = assets.find(a => a.id === h.asset_id)
    return asset ? enrichInvestmentHolding(h, asset) : h
  })
  const investedAmount = calculateInvestedAmount(enrichedHoldings)
  const netWorth = calculateNetWorth(totalBalance, investedAmount)

  // Calculate weekly growth
  const weeklyGrowth = snapshots.length >= 2
    ? ((snapshots[snapshots.length - 1].balance - snapshots[0].balance) / Math.max(1, snapshots[0].balance) * 100).toFixed(1)
    : '0'

  // Prepare chart data
  const chartData = snapshots.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    }),
    balance: s.balance,
  }))

  if (displayLoading) {
    return (
      <AuthenticatedLayout>
        <PageWrapper>
          <DashboardSkeleton />
        </PageWrapper>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <PageWrapper containerClassName="pt-8 pb-16">
        {/* Welcome Section with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            {t('dashboard.hello')}, {profile?.full_name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {new Date().toLocaleDateString(i18n.language, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </motion.div>

        {/* Balance Cards Grid */}
        <AnimatedContainer className="grid sm:grid-cols-3 gap-6 mb-12">
          {/* Total Balance Card - Premium Style */}
          <motion.div className="sm:col-span-3" variants={cardVariants}>
            <BalanceCard
              title={t('dashboard.totalBalance')}
              amount={<AnimatedNumber
                value={totalBalance}
                format={(v) => formatCurrencyDisplay(v)}
                duration={1200}
                className="text-5xl font-bold"
              />}
              subtitle={weeklyGrowth !== '0' ? `${parseFloat(weeklyGrowth) > 0 ? '+' : ''} ${weeklyGrowth}% this week` : undefined}
            >
              <div className="grid sm:grid-cols-3 gap-8 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                    {t('dashboard.available')}
                  </p>
                  <AnimatedNumber
                    value={availableBalance}
                    format={(v) => formatCurrencyDisplay(v)}
                    duration={1000}
                    className="text-2xl font-bold"
                  />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                    {t('dashboard.invested')}
                  </p>
                  <AnimatedNumber
                    value={investedAmount}
                    format={(v) => formatCurrencyDisplay(v)}
                    duration={1000}
                    className="text-2xl font-bold"
                  />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                    {t('dashboard.lockedInSavings')}
                  </p>
                  <AnimatedNumber
                    value={lockedInSavings}
                    format={(v) => formatCurrencyDisplay(v)}
                    duration={1000}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>
            </BalanceCard>
          </motion.div>

          {/* Stat Cards */}
          <motion.div variants={cardVariants}>
            <StatCard
              icon={<PieChart size={ICON_SIZE.md} />}
              label={t('dashboard.netWorth')}
              value={<AnimatedNumber
                value={netWorth}
                format={(v) => formatCurrencyDisplay(v)}
                className="text-3xl font-bold"
              />}
              change={netWorth > 0 ? '+0.0%' : '—'}
            />
          </motion.div>

          <motion.div variants={cardVariants}>
            <StatCard
              icon={<Wallet size={ICON_SIZE.md} />}
              label={t('dashboard.lockedInSavings')}
              value={<AnimatedNumber
                value={lockedInSavings}
                format={(v) => formatCurrencyDisplay(v)}
                className="text-3xl font-bold"
              />}
              change={`${savingsPlans.filter(p => p.status === 'active').length} ${t('dashboard.activePlans')}`}
            />
          </motion.div>

          <motion.div variants={cardVariants}>
            <button
              onClick={handleCopyAccountNumber}
              className="w-full text-left group"
            >
              <StatCard
                icon={<BarChart3 size={ICON_SIZE.md} />}
                label={t('dashboard.accountNumber')}
                value={
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-3xl font-bold">{profile?.account_number || '—'}</span>
                    {profile?.account_number && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copied ? (
                          <Check size={24} className="text-green-500" />
                        ) : (
                          <Copy size={24} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        )}
                      </span>
                    )}
                  </div>
                }
                change={`Member since ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}`}
              />
            </button>
          </motion.div>
        </AnimatedContainer>

        {/* Chart Section */}
        {chartData.length > 0 ? (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="mb-12"
          >
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{t('dashboard.balanceHistory')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">90-day performance</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#F3F4F6',
                        padding: '12px',
                      }}
                    />
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B7CFF" />
                        <stop offset="100%" stopColor="#6D4FFF" />
                      </linearGradient>
                    </defs>
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="url(#colorBalance)"
                      dot={false}
                      strokeWidth={3}
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="mb-12"
          >
            <Card className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('dashboard.noBallanceHistory')}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <Card>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">{t('dashboard.quickActions')}</h3>
              <QuickActions />
            </div>
          </Card>
        </motion.div>
      </PageWrapper>
    </AuthenticatedLayout>
  )
}
