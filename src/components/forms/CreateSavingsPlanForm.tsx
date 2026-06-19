import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/config/supabase'
import { formatCurrencyDisplay } from '@/utils/calculations'
import PINModal from './PINModal'

interface CreateSavingsPlanFormProps {
  currentBalance: number
  onSuccess?: () => void
}

export default function CreateSavingsPlanForm({ currentBalance, onSuccess }: CreateSavingsPlanFormProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [planType, setPlanType] = useState<'7d' | '30d' | '90d' | '180d'>('7d')
  const [showPINModal, setShowPINModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const interestRates: Record<string, number> = {
    '7d': 5,
    '30d': 10,
    '90d': 15,
    '180d': 25,
  }

  const interestRate = interestRates[planType] || 0
  const estimatedReturn = parseFloat(amount || '0') * (interestRate / 100)
  const totalReturn = parseFloat(amount || '0') + estimatedReturn

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > currentBalance) {
      setError(`Insufficient funds. Available: ${formatCurrencyDisplay(currentBalance)}`)
      return
    }

    setShowPINModal(true)
  }

  const handlePINConfirm = async (pin: string) => {
    setError(null)
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/savings/create-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          plan_type: planType,
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create savings plan')
      }

      setSuccess(true)
      setAmount('')
      setShowPINModal(false)

      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setShowPINModal(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-lg mb-2">Savings Plan Created</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invested {formatCurrencyDisplay(parseFloat(amount))}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Interest: {interestRate}%</p>
        <p className="text-sm font-medium text-green-600">Total Return: {formatCurrencyDisplay(totalReturn)}</p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Plan Duration</label>
          <div className="grid grid-cols-2 gap-2">
            {(['7d', '30d', '90d', '180d'] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => setPlanType(plan)}
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  planType === plan
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              placeholder="0.00"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Interest Rate:</span>
            <span className="font-bold text-blue-600">{interestRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Amount Locked:</span>
            <span className="font-bold">{formatCurrencyDisplay(parseFloat(amount || '0'))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Estimated Return:</span>
            <span className="font-bold text-green-600">{formatCurrencyDisplay(estimatedReturn)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium">Total After Unlock:</span>
            <span className="font-bold text-lg text-green-600">{formatCurrencyDisplay(totalReturn)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Available Balance</label>
          <p className="text-xl font-bold text-green-600">{formatCurrencyDisplay(currentBalance)}</p>
        </div>

        <button
          type="submit"
          disabled={!amount || isLoading}
          className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
        >
          {isLoading ? 'Creating...' : 'Create Savings Plan'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onConfirm={handlePINConfirm}
        onCancel={() => setShowPINModal(false)}
        title="Verify PIN"
        message="Enter your PIN to confirm savings plan"
        isLoading={isLoading}
      />
    </>
  )
}
