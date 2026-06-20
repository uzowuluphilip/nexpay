import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, PieChart, Wallet, Target, Gift } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { PageWrapper, AnimatedContainer } from '@/components/PageWrapper'
import { StatCard } from '@/components/Card'
import { cardVariants } from '@/utils/animations'
import { ICON_SIZE } from '@/utils/design-constants'
import { useTransactions, useSavingsPlans, useInvestmentHoldings, useMarketAssets } from '@/hooks/useData'
import { calculateTotalBalance, formatCurrencyDisplay, enrichInvestmentHolding } from '@/utils/calculations'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'

export default function StatsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: transactions = [] } = useTransactions()
  const { data: savingsPlans = [] } = useSavingsPlans()
  const { data: holdings = [] } = useInvestmentHoldings()
  const { data: assets = [] } = useMarketAssets()

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

  // Calculate metrics
  const totalBalance = calculateTotalBalance(transactions)
  const deposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length
  const totalProfit = holdings.reduce((sum, h) => {
    const asset = assets.find(a => a.id === h.asset_id)
    if (!asset) return sum
    const holding = enrichInvestmentHolding(h, asset)
    return sum + (holding.unrealized_pl || 0)
  }, 0)
  const netInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.entry_price), 0)
  const interestEarned = transactions.filter(t => t.type === 'interest' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)

  const stats = [
    { 
      icon: <Wallet size={ICON_SIZE.md} />,
      label: t('stats.netWorth'),
      value: formatCurrencyDisplay(totalBalance + netInvested),
      change: 'Updated now'
    },
    { 
      icon: <TrendingUp size={ICON_SIZE.md} />,
      label: t('stats.totalProfit'),
      value: formatCurrencyDisplay(totalProfit),
      change: totalProfit >= 0 ? '+0.0%' : '-0.0%',
      color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
    },
    { 
      icon: <PieChart size={ICON_SIZE.md} />,
      label: t('stats.netInvested'),
      value: formatCurrencyDisplay(netInvested),
      change: `${holdings.length} holdings`
    },
    { 
      icon: <Target size={ICON_SIZE.md} />,
      label: t('stats.depositCount'),
      value: deposits.toString(),
      change: 'transactions'
    },
    { 
      icon: <Gift size={ICON_SIZE.md} />,
      label: 'Interest Earned',
      value: formatCurrencyDisplay(interestEarned),
      change: 'Passive income'
    },
  ]

  return (
    <AuthenticatedLayout>
      <PageWrapper containerClassName="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">{t('stats.title') || 'Your Statistics'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Track your financial performance and progress</p>
        </motion.div>

        {/* Stats Grid */}
        <AnimatedContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={cardVariants}>
              <StatCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                change={stat.change}
              />
            </motion.div>
          ))}
        </AnimatedContainer>
      </PageWrapper>
    </AuthenticatedLayout>
  )
}
