import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { supabase } from '@/config/supabase'

export default function CreatePINPage() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [success, setSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    // Only set up the listener, don't log out on SIGNED_OUT events
    // The app-level auth will handle redirects if needed
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state in CreatePIN:', event, !!session)
        if (session?.user) {
          setCurrentUser(session.user)
          setAuthChecking(false)
        } else {
          // Still try to get user even if session is gone
          // Don't navigate away yet
          setAuthChecking(false)
        }
      }
    )

    // Also check current session on mount
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUser(session.user)
        } else {
          // Try getting user with getUser
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setCurrentUser(user)
          } else {
            // No authenticated user, redirect to login
            navigate('/login', { replace: true })
          }
        }
      } catch (err) {
        console.error('Auth check failed in CreatePIN:', err)
        // Don't navigate on error - let user try
      } finally {
        setAuthChecking(false)
      }
    }
    checkAuth()

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [navigate])

  const validatePin = (value: string): boolean => {
    return /^\d{4}$/.test(value)
  }

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (step === 'create') {
      setPin(value)
    } else {
      setConfirmPin(value)
    }
    setError('')
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePin(pin)) {
      setError(t('pin.pinMustBe4Digits'))
      return
    }
    setStep('confirm')
    setConfirmPin('')
  }

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validatePin(pin)) {
      setError(t('pin.pinMustBe4Digits'))
      return
    }

    if (!validatePin(confirmPin)) {
      setError(t('pin.pinMustBe4Digits'))
      return
    }

    if (pin !== confirmPin) {
      setError(t('pin.pinsMustMatch'))
      return
    }

    setLoading(true)

    try {
      if (!currentUser) {
        // Try to get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
      }

      const userId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id

      if (!userId) {
        throw new Error('Could not determine user ID')
      }

      // Create PIN record
      const { error: pinError } = await supabase
        .from('pins')
        .insert([
          {
            user_id: userId,
            hashed_pin: pin,
          },
        ])

      if (pinError) {
        // Ignore "duplicate key" errors - PIN might already exist
        if (!pinError.message?.includes('duplicate')) {
          throw pinError
        }
      }

      setSuccess(true)
      
      // Navigate to dashboard immediately after PIN is created
      // The dashboard will initialize with the session that already exists
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create PIN'
      setError(errorMessage)
      console.error('PIN creation error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('pin.pinCreated')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('common.loading')}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <Lock size={48} className="text-primary-500 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('common.loading')}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Not Authenticated
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please log in to continue
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Lock className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {step === 'create' ? t('pin.createPIN') : t('pin.confirmPIN')}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
            {step === 'create' 
              ? t('pin.pinDescription')
              : t('pin.pinConfirmDescription')
            }
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 'create' ? handleNext : handleCreatePin} className="space-y-6">
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {step === 'create' ? t('pin.createPIN') : t('pin.confirmPIN')}
              </label>
              
              {/* PIN digit inputs */}
              <div className="flex justify-between gap-2 mb-4">
                {[0, 1, 2, 3].map((index) => {
                  const pinValue = step === 'create' ? pin : confirmPin
                  return (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={pinValue[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 1) {
                          if (step === 'create') {
                            const newPin = (pin + value).slice(0, 4)
                            setPin(newPin)
                          } else {
                            const newPin = (confirmPin + value).slice(0, 4)
                            setConfirmPin(newPin)
                          }
                          
                          // Auto-focus next input
                          if (value && index < 3) {
                            const nextInput = document.querySelector(
                              `input[data-pin-index="${index + 1}"]`
                            ) as HTMLInputElement
                            nextInput?.focus()
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          const currentValue = step === 'create' ? pin : confirmPin
                          if (!currentValue[index] && index > 0) {
                            const prevInput = document.querySelector(
                              `input[data-pin-index="${index - 1}"]`
                            ) as HTMLInputElement
                            prevInput?.focus()
                          }
                        }
                      }}
                      data-pin-index={index}
                      className="w-16 h-16 text-center text-3xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      disabled={loading}
                    />
                  )
                })}
              </div>
            </div>

            {/* Step 1: Create PIN */}
            {step === 'create' && (
              <button
                type="submit"
                disabled={loading || !validatePin(pin)}
                className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.loading') : t('common.next')}
              </button>
            )}

            {/* Step 2: Confirm PIN */}
            {step === 'confirm' && (
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !validatePin(confirmPin)}
                  className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.loading') : t('common.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('create')
                    setConfirmPin('')
                    setError('')
                  }}
                  className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('common.back')}
                </button>
              </div>
            )}
          </form>

          {/* Info box */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>💡 {t('common.warning')}:</strong> {t('pin.pinDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
