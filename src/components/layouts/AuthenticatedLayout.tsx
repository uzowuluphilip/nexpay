import { useState, ReactNode, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Menu, X, Moon, Sun, Settings, Home, Wallet, TrendingUp, BarChart3, Activity, Globe } from 'lucide-react'
import { supabase } from '@/config/supabase'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

interface LanguageOption {
  code: string
  name: string
  flag: string
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [isDark, setIsDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  const languages: LanguageOption[] = [
    { code: 'en', name: 'English', flag: 'US' },
    { code: 'es', name: 'Español', flag: 'ES' },
    { code: 'fr', name: 'Français', flag: 'FR' },
  ]

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    setLangMenuOpen(false)
  }

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false)
      }
    }

    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [langMenuOpen])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const bottomNavItems = [
    { label: t('common.home'), path: '/dashboard', icon: Home },
    { label: t('common.wallet'), path: '/wallet', icon: Wallet },
    { label: t('common.grow'), path: '/grow', icon: TrendingUp },
    { label: t('common.stats'), path: '/stats', icon: BarChart3 },
    { label: t('common.activity'), path: '/activity', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-gray-900 dark:text-white transition-colors pb-24">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <span className="hidden sm:inline text-xl font-bold text-primary-500">
                {t('common.appName')}
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
                </button>

                {/* Dropdown Menu */}
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-primary-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <span className="font-semibold text-sm min-w-[30px]">{lang.flag}</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs opacity-70">[{lang.code.toUpperCase()}]</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={20} />
                {t('common.logout')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 space-y-2 pb-4">
              {/* Language Selector Mobile */}
              <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800">
                <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <Globe size={16} />
                  {t('common.language')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code)
                        setMobileMenuOpen(false)
                      }}
                      className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                        i18n.language === lang.code
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {lang.flag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                {isDark ? t('common.lightMode') : t('common.darkMode')}
              </button>
              <button
                onClick={() => {
                  navigate('/profile')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-2 text-left rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Settings size={20} />
                {t('common.profile')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={20} />
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sm:hidden shadow-lg">
        <div className="flex justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 py-4 text-center border-t-2 transition-colors ${
                  location.pathname === item.path
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex justify-center mb-1"><Icon size={24} /></div>
                <div className="text-xs font-medium">{item.label}</div>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation (optional - for future use) */}
      <div className="hidden sm:block fixed left-0 bottom-20 pb-4 px-4 space-y-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
