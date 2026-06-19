import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, ArrowRight, Check, PiggyBank, TrendingUp, Send, BarChart3, Menu, X, Globe, ChevronDown } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isDark, setIsDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Check for saved theme preference or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false)
      }
    }

    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [langDropdownOpen])

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

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    setLangDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-gray-900 dark:text-white transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-light/80 dark:bg-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-white">N</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-primary-500 whitespace-nowrap">
                {t('common.appName')}
              </span>
            </div>

            {/* Desktop - Center Language Selector */}
            <div className="hidden sm:flex items-center gap-2">
              {['en', 'es', 'fr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    i18n.language === lang
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Desktop - Right Section */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 sm:px-6 py-2 text-primary-500 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors text-sm sm:text-base"
              >
                {t('common.logIn')}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 sm:px-6 py-2 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow text-sm sm:text-base"
              >
                {t('common.signUp')}
              </button>
            </div>

            {/* Mobile - Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
              {/* Language Dropdown */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Globe size={18} />
                    {i18n.language.toUpperCase()}
                  </span>
                  <ChevronDown size={18} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Language Dropdown Menu */}
                {langDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {['en', 'es', 'fr'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          i18n.language === lang
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {lang === 'en' ? '🇺🇸 English' : lang === 'es' ? '🇪🇸 Español' : '🇫🇷 Français'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  toggleTheme()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>

              {/* Log In Button */}
              <button
                onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-primary-500 font-semibold bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm"
              >
                {t('common.logIn')}
              </button>

              {/* Sign Up Button */}
              <button
                onClick={() => {
                  navigate('/signup')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow text-sm"
              >
                {t('common.signUp')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          {t('landing.hero')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          {t('landing.heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            {t('common.signUp')}
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            {t('common.logIn')}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t('landing.features')}</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: PiggyBank, title: t('landing.save'), desc: t('landing.saveDesc') },
              { icon: TrendingUp, title: t('landing.invest'), desc: t('landing.investDesc') },
              { icon: Send, title: t('landing.send'), desc: t('landing.sendDesc') },
              { icon: BarChart3, title: t('landing.track'), desc: t('landing.trackDesc') },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="text-primary-500 mb-4">
                  <feature.icon size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">{t('landing.howItWorks')}</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: '1', title: t('landing.step1'), desc: t('landing.step1Desc') },
              { num: '2', title: t('landing.step2'), desc: t('landing.step2Desc') },
              { num: '3', title: t('landing.step3'), desc: t('landing.step3Desc') },
              { num: '4', title: t('landing.step4'), desc: t('landing.step4Desc') },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">{t('landing.testimonials')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('landing.testimonialNote')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', text: 'Smart Finance made it easy to manage my investments and savings all in one place.' },
              { name: 'John D.', text: 'The intuitive interface and real-time analytics help me stay on top of my finances.' },
              { name: 'Alex P.', text: 'Transparent fees and honest calculations - exactly what I was looking for in a fintech app.' },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-primary rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to take control of your finances?</h2>
          <p className="text-lg mb-8 opacity-90">Join thousands of users managing their money with Nex Pay</p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:shadow-lg transition-shadow"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-white">N</span>
                </div>
                <span className="font-bold text-white">{t('common.appName')}</span>
              </div>
              <p className="text-sm">{t('landing.footerAboutDesc')}</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">{t('landing.footerLinks')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">{t('landing.footerContact')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@nexpay.com" className="hover:text-white">support@nexpay.com</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">{t('landing.footerPrivacy')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footerTerms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 {t('common.appName')} - {t('landing.footerAbout')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
