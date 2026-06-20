import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import LandingPage from '@/pages/LandingPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import LoginPage from '@/pages/auth/LoginPage'
import CreatePINPage from '@/pages/auth/CreatePINPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import WalletPage from '@/pages/wallet/WalletPage'
import GrowPage from '@/pages/grow/GrowPage'
import StatsPage from '@/pages/stats/StatsPage'
import ActivityPage from '@/pages/activity/ActivityPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import type { User } from '@supabase/supabase-js'

const queryClient = new QueryClient()

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCreatedPin, setHasCreatedPin] = useState(false)
  const [profileExists, setProfileExists] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        // Always assume profile exists and PIN hasn't been created
        // These will be checked/created on-demand by the pages themselves
        setProfileExists(true)
        setHasCreatedPin(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        setProfileExists(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Always assume profile exists and PIN hasn't been created
          // These will be checked/created on-demand by the pages themselves
          setProfileExists(true)
          setHasCreatedPin(false)
        } else {
          setProfileExists(false)
          setHasCreatedPin(false)
        }
      }
    )

    // Listen for visibility change to re-check PIN status
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription?.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-primary-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={
              user 
                ? hasCreatedPin 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/create-pin" replace />
                : <LandingPage />
            } 
          />
          <Route 
            path="/signup" 
            element={
              user 
                ? hasCreatedPin 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/create-pin" replace />
                : <SignUpPage />
            } 
          />
          <Route 
            path="/login" 
            element={
              user 
                ? hasCreatedPin 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/create-pin" replace />
                : <LoginPage />
            } 
          />

          {/* PIN creation route - only for users without PIN */}
          <Route 
            path="/create-pin" 
            element={
              user && !hasCreatedPin 
                ? <CreatePINPage />
                : user && hasCreatedPin
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            } 
          />

          {/* Authenticated routes - protected by component-level auth checks */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/grow" element={<GrowPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
