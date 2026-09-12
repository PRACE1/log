import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button, ToastProvider } from '@listeningkit/ui'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardOverview } from './components/DashboardOverview'
import { DashboardSettings } from './components/DashboardSettings'
import { DashboardGroups } from './components/DashboardGroups'
import { DashboardAccounts } from './components/DashboardAccounts'
import { DashboardMessanger } from './components/DashboardMessanger'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
})

function HomePage() {
  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">ListeningKit Hackathon</p>
        <h1 className="text-4xl font-bold">Vite monorepo is running.</h1>
        <p className="text-text-secondary">
          Stack matches open-offer-builder / dialer: Vite + React 18 + TS + react-router + TanStack Query +
          Tailwind 3. Shared UI lives in <code>@listeningkit/ui</code>.
        </p>
        <div className="flex gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">
            <Link to="/onboarding">Onboarding</Link>
          </Button>
          <Button variant="ghost">
            <Link to="/health">Health check</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

function HealthPage() {
  return (
    <div className="min-h-screen bg-surface-primary p-8 text-text-primary">
      <p className="text-sm text-text-secondary">ok — router + query client wired.</p>
      <Link to="/" className="text-brand-600 underline">
        Back home
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
            <Route path="/" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="groups" element={<DashboardGroups />} />
              <Route path="accounts" element={<DashboardAccounts />} />
              <Route path="messages" element={<DashboardMessanger />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Route>
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  )
}
