import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { supabase } from '@/config/supabase'
import { PageWrapper, AnimatedContainer } from '@/components/PageWrapper'
import { Card, BalanceCard } from '@/components/Card'
import { Button } from '@/components/Button'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { cardVariants, containerVariants } from '@/utils/animations'
import { SPACING, ICON_SIZE, RADIUS } from '@/utils/design-constants'
import { useLoadingState } from '@/hooks/useAnimations'
import { useTransactions, useUserProfile } from '@/hooks/useData'
import { calculateTotalBalance, formatCurrencyDisplay } from '@/utils/calculations'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import DepositForm from '@/components/forms/DepositForm'
import WithdrawForm from '@/components/forms/WithdrawForm'
import SendForm from '@/components/forms/SendForm'

export default function WalletPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: transactions = [], refetch, isLoading } = useTransactions()
  const { data: profile } = useUserProfile()
  const totalBalance = calculateTotalBalance(transactions)
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

  const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'withdraw' | 'send'>('balance')

  const tabs = [
    { id: 'balance' as const, label: t('wallet.transactions') },
    { id: 'deposit' as const, label: t('wallet.deposit') },
    { id: 'withdraw' as const, label: t('wallet.withdraw') },
    { id: 'send' as const, label: t('wallet.send') },
  ]

  return (
    <AuthenticatedLayout>
      <PageWrapper containerClassName="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">{t('wallet.title') || 'Wallet'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('wallet.subtitle') || 'Manage your funds'}</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <BalanceCard
            title={t('wallet.availableBalance')}
            amount={displayLoading ? '—' : <AnimatedNumber
              value={totalBalance}
              format={(v) => formatCurrencyDisplay(v)}
              className="text-5xl font-bold"
            />}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-2 flex-wrap"
          style={{ borderRadius: `${RADIUS.lg}px` }}
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

        {/* Tab Content */}
        <AnimatedContainer>
          {activeTab === 'balance' && (
            <motion.div variants={cardVariants} key="balance">
              <Card>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{t('common.transactions')}</h3>
                  {displayLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-12">
                      {t('wallet.noTransactions')}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {transactions.map((tx, idx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{
                            padding: `${SPACING.base}px`,
                            borderRadius: `${RADIUS.md}px`,
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                          className="flex items-center justify-between dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div>
                            <p className="font-semibold capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{tx.description}</p>
                          </div>
                          <p
                            className={`font-bold text-lg ${
                              ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell'].includes(tx.type)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell'].includes(tx.type)
                              ? '+'
                              : '-'}
                            {formatCurrencyDisplay(tx.amount)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'deposit' && (
            <motion.div variants={cardVariants} key="deposit">
              <Card>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">{t('wallet.deposit')}</h3>
                  <DepositForm 
                    userAccountNumber={profile?.account_number}
                    onSuccess={() => { 
                      setActiveTab('balance')
                      refetch()
                    }} 
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'withdraw' && (
            <motion.div variants={cardVariants} key="withdraw">
              <Card>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">{t('wallet.withdraw')}</h3>
                  <WithdrawForm 
                    currentBalance={totalBalance} 
                    onSuccess={() => { 
                      setActiveTab('balance')
                      refetch()
                    }} 
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'send' && (
            <motion.div variants={cardVariants} key="send">
              <Card>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">{t('wallet.send')}</h3>
                  <SendForm 
                    currentBalance={totalBalance} 
                    onSuccess={() => { 
                      setActiveTab('balance')
                      refetch()
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
