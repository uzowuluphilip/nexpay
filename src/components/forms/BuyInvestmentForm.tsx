import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/config/supabase'
import { formatCurrencyDisplay } from '@/utils/calculations'
import PINModal from './PINModal'
import type { MarketAsset } from '@/types'

interface BuyInvestmentFormProps {
  currentBalance: number
  onSuccess?: () => void
}

export default function BuyInvestmentForm({ currentBalance, onSuccess }: BuyInvestmentFormProps) {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<MarketAsset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [showPINModal, setShowPINModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadAssets = async () => {
      const { data, error } = await supabase.from('market_assets').select('*')
      if (!error && data) {
        setAssets(data)
        if (data.length > 0) {
          setSelectedAssetId(data[0].id)
        }
      }
    }
    loadAssets()
  }, [])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)
  const totalCost = selectedAsset ? parseFloat(quantity || '0') * selectedAsset.current_price : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedAssetId) {
      setError('Please select an asset')
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (totalCost > currentBalance) {
      setError(`Insufficient funds. Cost: ${formatCurrencyDisplay(totalCost)}, Available: ${formatCurrencyDisplay(currentBalance)}`)
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

      const response = await fetch('/api/investments/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          quantity: parseFloat(quantity),
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to buy investment')
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

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-lg mb-2">Investment Purchased</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bought {quantity} shares of {selectedAsset?.symbol}</p>
        <p className="text-sm font-medium">Cost: {formatCurrencyDisplay(totalCost)}</p>
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
          <label className="block text-sm font-medium mb-2">Select Asset</label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            disabled={isLoading || assets.length === 0}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.symbol} - {asset.name} ({formatCurrencyDisplay(asset.current_price)})
              </option>
            ))}
          </select>
        </div>

        {selectedAsset && (
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Current Price:</span>
              <span className="font-bold">{formatCurrencyDisplay(selectedAsset.current_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Asset:</span>
              <span className="font-bold">{selectedAsset.name}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isLoading}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Unit Price:</span>
            <span className="font-bold">{formatCurrencyDisplay(selectedAsset?.current_price || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Quantity:</span>
            <span className="font-bold">{quantity || '0'}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium">Total Cost:</span>
            <span className="font-bold text-lg text-blue-600">{formatCurrencyDisplay(totalCost)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Available Balance</label>
          <p className="text-xl font-bold text-green-600">{formatCurrencyDisplay(currentBalance)}</p>
        </div>

        <button
          type="submit"
          disabled={!quantity || isLoading || assets.length === 0}
          className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
        >
          {isLoading ? 'Purchasing...' : 'Buy Investment'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onConfirm={handlePINConfirm}
        onCancel={() => setShowPINModal(false)}
        title="Verify PIN"
        message="Enter your PIN to confirm purchase"
        isLoading={isLoading}
      />
    </>
  )
}
