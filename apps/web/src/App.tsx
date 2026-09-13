import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@listeningkit/ui'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardOverview } from './components/DashboardOverview'
import { DashboardSettings } from './components/DashboardSettings'
import { DashboardGroups } from './components/DashboardGroups'
import { DashboardAccounts } from './components/DashboardAccounts'
import { DashboardMessages } from './components/DashboardMessages'
import { DashboardListings } from './components/DashboardListings'
import { DashboardKeywords } from './components/DashboardKeywords'
import { DashboardAnalyticsOverview } from './components/DashboardAnalyticsOverview'
import { DashboardAnalyticsPage } from './components/DashboardAnalyticsPage'
import { DashboardAccountPage } from './components/DashboardAccountPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
})

function HealthPage() {
  return (
    <div className="min-h-screen bg-surface-primary p-8 text-text-primary">
      <p className="text-sm text-text-secondary">ok — router + query client wired.</p>
      <Link to="/onboarding" className="text-brand-600 underline">
        Back to onboarding
      </Link>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="groups" element={<DashboardGroups />} />
              <Route path="facebook/listings" element={<DashboardListings />} />
              <Route path="keywords" element={<DashboardKeywords />} />
              <Route path="analytics" element={<DashboardAnalyticsOverview />} />
              <Route path="analytics/:keywordId" element={<DashboardAnalyticsPage />} />
              <Route path="accounts" element={<DashboardAccounts />} />
              <Route path="accounts/:accountId" element={<DashboardAccountPage />} />
              <Route path="messages" element={<DashboardMessages />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Route>
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  )
}
