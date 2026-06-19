import { useState } from 'react'
import { X } from 'lucide-react'

interface PINModalProps {
  isOpen: boolean
  onConfirm: (pin: string) => void
  onCancel: () => void
  title?: string
  message?: string
  isLoading?: boolean
}

export default function PINModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Verify PIN',
  message = 'Enter your 4-digit PIN to confirm this action',
  isLoading = false,
}: PINModalProps) {
  const [pin, setPin] = useState(['', '', '', ''])

  if (!isOpen) return null

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)

    // Auto-focus next field
    if (value && index < 3) {
      const nextInput = document.querySelector(`input[data-pin-index="${index + 1}"]`) as HTMLInputElement
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-pin-index="${index - 1}"]`) as HTMLInputElement
      if (prevInput) prevInput.focus()
    }

    if (e.key === 'Enter') {
      const pinString = pin.join('')
      if (pinString.length === 4) {
        onConfirm(pinString)
      }
    }
  }

  const pinString = pin.join('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="space-y-6">
          {/* PIN Input Fields */}
          <div className="flex gap-3 justify-center">
            {pin.map((digit, index) => (
              <input
                key={index}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                data-pin-index={index}
                disabled={isLoading}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800 disabled:opacity-50"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(pinString)}
              disabled={pinString.length !== 4 || isLoading}
              className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-shadow"
            >
              {isLoading ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
