import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/config/supabase'
import { formatCurrencyDisplay } from '@/utils/calculations'
import PINModal from './PINModal'

interface WithdrawFormProps {
  currentBalance: number
  onSuccess?: () => void
}

export default function WithdrawForm({ currentBalance, onSuccess }: WithdrawFormProps) {
  const { t } = useTranslation()
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [showPINModal, setShowPINModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!accountNumber) {
      setError('Please enter account number')
      return
    }

    if (!bankName) {
      setError('Please enter bank name')
      return
    }

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

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_name: bankName,
          amount: parseFloat(amount),
          pin,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal')
      }

      setSuccess(true)
      setNewBalance(data.balance)
      setAccountNumber('')
      setBankName('')
      setAmount('')
      setDescription('')
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

  if (success && newBalance !== null) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-lg mb-2">Withdrawal Successful</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Withdrew {formatCurrencyDisplay(parseFloat(amount))} to {bankName} ({accountNumber})</p>
        <p className="text-sm font-medium">New Balance: {formatCurrencyDisplay(newBalance)}</p>
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
          <label className="block text-sm font-medium mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., 1234567890"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Chase Bank"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
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

        <div>
          <label className="block text-sm font-medium mb-2">Available Balance</label>
          <p className="text-xl font-bold text-green-600">{formatCurrencyDisplay(currentBalance)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Bank withdrawal"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!accountNumber || !bankName || !amount || isLoading}
          className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
        >
          {isLoading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onConfirm={handlePINConfirm}
        onCancel={() => setShowPINModal(false)}
        title="Verify PIN"
        message="Enter your PIN to confirm withdrawal"
        isLoading={isLoading}
      />
    </>
  )
}
