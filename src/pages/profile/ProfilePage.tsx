import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Copy, Check, LogOut } from 'lucide-react'
import { supabase } from '@/config/supabase'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import { useUserProfile } from '@/hooks/useData'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: profile } = useUserProfile()
  const [copied, setCopied] = useState(false)

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
  const [loading, setLoading] = useState(false)

  const handleCopyAccountNumber = () => {
    if (profile?.account_number) {
      navigator.clipboard.writeText(profile.account_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            {t('common.loading')}...
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white rounded-3xl p-8 shadow-2xl mb-8 text-center backdrop-blur-xl border border-purple-400/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-300/10 rounded-full blur-2xl -ml-12 -mb-12" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-full mx-auto mb-4 flex items-center justify-center border border-white/30 shadow-lg">
              <span className="text-4xl font-bold">{profile.full_name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">{profile.full_name || 'User'}</h1>
            <p className="text-white/70 text-sm font-medium">{profile.email}</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.fullName')}</p>
            <p className="text-xl font-semibold">{profile.full_name || '—'}</p>
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-gray-600 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.email')}</p>
            </div>
            <p className="text-lg font-mono break-all">{profile.email}</p>
          </div>

          {/* Account Number */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.accountNumber')}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-mono font-bold">{profile.account_number || '—'}</p>
              <button
                onClick={handleCopyAccountNumber}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy account number"
              >
                {copied ? (
                  <Check size={20} className="text-green-500" />
                ) : (
                  <Copy size={20} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.memberSince')}</p>
            <p className="text-lg font-semibold">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-6"
          >
            <LogOut size={20} />
            {loading ? t('common.loading') : t('common.logout')}
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
