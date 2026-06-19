import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ChevronLeft, TrendingUp, Wallet, Target } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { PageWrapper, AnimatedContainer } from '@/components/PageWrapper'
import { Card, StatCard } from '@/components/Card'
import { Button } from '@/components/Button'
import { cardVariants, containerVariants } from '@/utils/animations'
import { SPACING, ICON_SIZE, RADIUS } from '@/utils/design-constants'
import { useLoadingState } from '@/hooks/useAnimations'
import { useSavingsPlans, useInvestmentHoldings, useTransactions } from '@/hooks/useData'
import { calculateTotalBalance, formatCurrencyDisplay } from '@/utils/calculations'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import CreateSavingsPlanForm from '@/components/forms/CreateSavingsPlanForm'
import BuyInvestmentForm from '@/components/forms/BuyInvestmentForm'
import SellInvestmentForm from '@/components/forms/SellInvestmentForm'

export default function GrowPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

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

  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const totalBalance = calculateTotalBalance(transactions)
  const { data: savingsPlans = [], refetch: refetchSavings, isLoading: savLoading } = useSavingsPlans()
  const { data: holdings = [], refetch: refetchHoldings, isLoading: holdLoading } = useInvestmentHoldings()
  const [activeTab, setActiveTab] = useState<'savings' | 'invest_buy' | 'invest_sell'>('savings')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const displayLoading = useLoadingState(txLoading || savLoading || holdLoading, 300)

  const tabs = [
    { id: 'savings' as const, label: t('grow.savings') },
    { id: 'invest_buy' as const, label: 'Buy Investment' },
    { id: 'invest_sell' as const, label: 'Sell Investment' },
  ]

  const activePlans = savingsPlans.filter(p => p.status === 'active').length
  const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * (h.entry_price || 0)), 0)

  return (
    <AuthenticatedLayout>
      <PageWrapper containerClassName="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">{t('grow.title') || 'Grow Your Wealth'}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('grow.subtitle') || 'Invest in savings plans and market assets'}</p>
        </motion.div>

        {/* Stats Overview */}
        {!showCreateForm && (
          <AnimatedContainer className="grid sm:grid-cols-3 gap-6 mb-8">
            <motion.div variants={cardVariants}>
              <StatCard
                icon={<Target size={ICON_SIZE.md} />}
                label={t('grow.activePlans') || 'Active Plans'}
                value={activePlans}
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                icon={<TrendingUp size={ICON_SIZE.md} />}
                label={t('grow.totalInvested') || 'Total Invested'}
                value={formatCurrencyDisplay(totalInvested)}
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                icon={<Wallet size={ICON_SIZE.md} />}
                label={t('wallet.availableBalance') || 'Available'}
                value={formatCurrencyDisplay(totalBalance)}
              />
            </motion.div>
          </AnimatedContainer>
        )}

        {/* Tabs */}
        {!showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex gap-2 flex-wrap"
          >
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: `${SPACING.md}px ${SPACING.base}px`,
                  borderRadius: `${RADIUS.md}px`,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === tab.id ? '#8B5CF6' : 'rgba(0,0,0,0.05)',
                  color: activeTab === tab.id ? 'white' : 'inherit',
                }}
                className="dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {tab.label}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Content */}
        <AnimatedContainer>
          {/* Savings Plans Tab */}
          {activeTab === 'savings' && !showCreateForm && (
            <motion.div key="savings" variants={cardVariants} className="space-y-4">
              {displayLoading ? (
                <Card>
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </Card>
              ) : savingsPlans.length === 0 ? (
                <Card className="text-center py-12">
                  <div className="space-y-4">
                    <Target size={48} className="mx-auto text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{t('grow.noSavingsPlans')}</p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="primary"
                    >
                      {t('grow.createSavingsPlan')}
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {savingsPlans.map((plan, idx) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold capitalize">{plan.plan_type} Plan</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(plan.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <motion.span
                              style={{
                                padding: `${SPACING.sm}px ${SPACING.md}px`,
                                borderRadius: `${RADIUS.sm}px`,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                              className={`${
                                plan.status === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : plan.status === 'matured'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                              }`}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                            </motion.span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                Amount
                              </p>
                              <p className="font-bold text-lg">{formatCurrencyDisplay(plan.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                Interest Rate
                              </p>
                              <p className="font-bold text-lg text-green-600">{plan.interest_rate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                Unlock Date
                              </p>
                              <p className="font-bold">{new Date(plan.unlock_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">
                                Total Payout
                              </p>
                              <p className="font-bold text-green-600">{formatCurrencyDisplay(plan.payout_amount || 0)}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                  >
                    {t('grow.createSavingsPlan')}
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Buy Investment Tab */}
          {activeTab === 'invest_buy' && !showCreateForm && (
            <motion.div key="buy" variants={cardVariants}>
              <Card>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Buy Investment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Balance: <span className="font-semibold">{formatCurrencyDisplay(totalBalance)}</span>
                    </p>
                  </div>
                  <BuyInvestmentForm
                    currentBalance={totalBalance}
                    onSuccess={() => refetchHoldings()}
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Sell Investment Tab */}
          {activeTab === 'invest_sell' && !showCreateForm && (
            <motion.div key="sell" variants={cardVariants}>
              <Card>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">Sell Investment</h3>
                  <SellInvestmentForm onSuccess={() => refetchHoldings()} />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <motion.div key="form" variants={cardVariants}>
              <Card>
                <div className="space-y-6">
                  <motion.button
                    whileHover={{ x: -4 }}
                    onClick={() => setShowCreateForm(false)}
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold"
                  >
                    <ChevronLeft size={20} />
                    Back to Plans
                  </motion.button>
                  <CreateSavingsPlanForm
                    currentBalance={totalBalance}
                    onSuccess={() => {
                      setShowCreateForm(false)
                      refetchSavings()
                    }}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatedContainer>
      </PageWrapper>
    </AuthenticatedLayout>
  )
}
