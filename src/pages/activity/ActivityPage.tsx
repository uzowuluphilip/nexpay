import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Coins,
  Gift,
} from 'lucide-react'
import { supabase } from '@/config/supabase'
import { PageWrapper, AnimatedContainer } from '@/components/PageWrapper'
import { Card } from '@/components/Card'
import { cardVariants } from '@/utils/animations'
import { SPACING, RADIUS, ICON_SIZE } from '@/utils/design-constants'
import { useTransactions } from '@/hooks/useData'
import { formatCurrencyDisplay } from '@/utils/calculations'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'

export default function ActivityPage() {
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

  const { data: transactions = [] } = useTransactions()

  const getTransactionIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      deposit: <ArrowDownToLine size={ICON_SIZE.lg} />,
      withdraw: <ArrowUpFromLine size={ICON_SIZE.lg} />,
      send: <Send size={ICON_SIZE.lg} />,
      receive: <ArrowDownLeft size={ICON_SIZE.lg} />,
      invest_buy: <TrendingUp size={ICON_SIZE.lg} />,
      invest_sell: <TrendingDown size={ICON_SIZE.lg} />,
      interest: <Gift size={ICON_SIZE.lg} />,
      savings_payout: <Coins size={ICON_SIZE.lg} />,
    }
    return iconMap[type] || <Coins size={ICON_SIZE.lg} />
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: t('wallet.deposit'),
      withdraw: t('wallet.withdrawal'),
      send: t('wallet.sent'),
      receive: t('wallet.received'),
      invest_buy: t('wallet.investmentBuy'),
      invest_sell: t('wallet.investmentSell'),
      interest: t('wallet.interest'),
      savings_payout: 'Savings Payout',
    }
    return labels[type] || type
  }

  const getIconColor = (type: string): string => {
    const inflow = ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell']
    if (inflow.includes(type)) return 'text-green-600 dark:text-green-400'
    return 'text-purple-600 dark:text-purple-400'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <AuthenticatedLayout>
      <PageWrapper containerClassName="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">{t('activity.title') || 'Activity'}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Your transaction history and activity</p>
        </motion.div>

        {/* Transactions */}
        {transactions.length === 0 ? (
          <motion.div variants={cardVariants} initial="initial" animate="animate">
            <Card className="text-center py-16">
              <Coins size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t('wallet.noTransactions')}</p>
            </Card>
          </motion.div>
        ) : (
          <AnimatedContainer className="space-y-3">
            {transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between">
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        style={{
                          padding: `${SPACING.md}px`,
                          borderRadius: `${RADIUS.md}px`,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                        }}
                        className={`${getIconColor(tx.type)} dark:bg-gray-800 flex-shrink-0`}
                      >
                        {getTransactionIcon(tx.type)}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base truncate">
                          {getTransactionLabel(tx.type)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()} at{' '}
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Status */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p
                        className={`font-bold text-lg ${
                          ['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell'].includes(
                            tx.type
                          )
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {['deposit', 'receive', 'interest', 'savings_payout', 'invest_sell'].includes(
                          tx.type
                        )
                          ? '+'
                          : '-'}
                        {formatCurrencyDisplay(tx.amount)}
                      </p>
                      <motion.span
                        style={{
                          display: 'inline-block',
                          padding: `${SPACING.sm}px ${SPACING.md}px`,
                          borderRadius: `${RADIUS.sm}px`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginTop: '4px',
                        }}
                        className={getStatusColor(tx.status)}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </motion.span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatedContainer>
        )}
      </PageWrapper>
    </AuthenticatedLayout>
  )
}
