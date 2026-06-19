import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/config/supabase'
import { formatCurrencyDisplay } from '@/utils/calculations'
import PINModal from './PINModal'
import type { InvestmentHolding, MarketAsset } from '@/types'

interface HoldingWithAsset extends InvestmentHolding {
  asset?: MarketAsset
}

interface SellInvestmentFormProps {
  onSuccess?: () => void
}

export default function SellInvestmentForm({ onSuccess }: SellInvestmentFormProps) {
  const { t } = useTranslation()
  const [holdings, setHoldings] = useState<HoldingWithAsset[]>([])
  const [selectedHoldingId, setSelectedHoldingId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [showPINModal, setShowPINModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadHoldings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('investment_holdings')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        // Load asset data for each holding
        const holdingsWithAssets = await Promise.all(
          data.map(async (holding) => {
            const { data: asset } = await supabase
              .from('market_assets')
              .select('*')
              .eq('id', holding.asset_id)
              .single()
            return { ...holding, asset }
          })
        )
        setHoldings(holdingsWithAssets)
        if (holdingsWithAssets.length > 0) {
          setSelectedHoldingId(holdingsWithAssets[0].id)
        }
      }
    }
    loadHoldings()
  }, [])

  const selectedHolding = holdings.find((h) => h.id === selectedHoldingId)
  const proceedsAmount = selectedHolding && selectedHolding.asset ? parseFloat(quantity || '0') * selectedHolding.asset.current_price : 0
  const costBasis = selectedHolding ? parseFloat(quantity || '0') * selectedHolding.entry_price : 0
  const pnl = proceedsAmount - costBasis

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedHoldingId) {
      setError('Please select a holding')
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (selectedHolding && parseFloat(quantity) > selectedHolding.quantity) {
      setError(`You only have ${selectedHolding.quantity} shares`)
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
      const response = await fetch(`${apiUrl}/api/investments/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          holding_id: selectedHoldingId,
          quantity: parseFloat(quantity),
          current_price: selectedHolding?.asset?.current_price,
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sell investment')
      }

      setSuccess(true)
      setQuantity('')
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

  if (success && selectedHolding) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-lg mb-2">Investment Sold</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sold {quantity} shares of {selectedHolding.asset?.symbol}</p>
        <p className="text-sm font-medium">Proceeds: {formatCurrencyDisplay(proceedsAmount)}</p>
        <p className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          P&L: {pnl >= 0 ? '+' : ''}{formatCurrencyDisplay(pnl)}
        </p>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">You don't have any investments yet.</p>
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
          <label className="block text-sm font-medium mb-2">Select Investment to Sell</label>
          <select
            value={selectedHoldingId}
            onChange={(e) => setSelectedHoldingId(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          >
            {holdings.map((holding) => (
              <option key={holding.id} value={holding.id}>
                {holding.asset?.symbol} - {holding.quantity} shares @ {formatCurrencyDisplay(holding.entry_price)}
              </option>
            ))}
          </select>
        </div>

        {selectedHolding && selectedHolding.asset && (
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Current Price:</span>
              <span className="font-bold">{formatCurrencyDisplay(selectedHolding.asset.current_price)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Entry Price:</span>
              <span className="font-bold">{formatCurrencyDisplay(selectedHolding.entry_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Shares Owned:</span>
              <span className="font-bold">{selectedHolding.quantity}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Quantity to Sell</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={selectedHolding?.quantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isLoading}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Current Price:</span>
            <span className="font-bold">{formatCurrencyDisplay(selectedHolding?.asset?.current_price || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Entry Price:</span>
            <span className="font-bold">{formatCurrencyDisplay(selectedHolding?.entry_price || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Quantity:</span>
            <span className="font-bold">{quantity || '0'}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium">Proceeds:</span>
            <span className="font-bold text-lg text-blue-600">{formatCurrencyDisplay(proceedsAmount)}</span>
          </div>
          <div className={`flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800`}>
            <span className="text-sm font-medium">P&L:</span>
            <span className={`font-bold text-lg ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pnl >= 0 ? '+' : ''}{formatCurrencyDisplay(pnl)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!quantity || isLoading}
          className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
        >
          {isLoading ? 'Selling...' : 'Sell Investment'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onConfirm={handlePINConfirm}
        onCancel={() => setShowPINModal(false)}
        title="Verify PIN"
        message="Enter your PIN to confirm sale"
        isLoading={isLoading}
      />
    </>
  )
}
