import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/config/supabase'
import { formatCurrencyDisplay } from '@/utils/calculations'
import PINModal from './PINModal'

interface SendFormProps {
  currentBalance: number
  onSuccess?: () => void
}

export default function SendForm({ currentBalance, onSuccess }: SendFormProps) {
  const { t } = useTranslation()
  const [recipientEmail, setRecipientEmail] = useState('')
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

    if (!recipientEmail) {
      setError('Please enter a recipient email')
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

      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          amount: parseFloat(amount),
          pin,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send funds')
      }

      setSuccess(true)
      setNewBalance(data.balance)
      setRecipientEmail('')
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
        <h3 className="font-bold text-lg mb-2">Transfer Successful</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sent {formatCurrencyDisplay(parseFloat(amount))} to {recipientEmail}</p>
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
          <label className="block text-sm font-medium mb-2">Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={isLoading}
            placeholder="recipient@example.com"
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
            placeholder="e.g., Payment for lunch"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!recipientEmail || !amount || isLoading}
          className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onConfirm={handlePINConfirm}
        onCancel={() => setShowPINModal(false)}
        title="Verify PIN"
        message="Enter your PIN to confirm transfer"
        isLoading={isLoading}
      />
    </>
  )
}
