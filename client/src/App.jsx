import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import Spinner from './components/ui/Spinner'
import FocusOverlay from './components/focus/FocusOverlay'

const LandingPage       = lazy(() => import('./pages/LandingPage'))
const AuthPage          = lazy(() => import('./pages/AuthPage'))
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage'))
const DashboardPage     = lazy(() => import('./pages/DashboardPage'))
const RoadmapPage       = lazy(() => import('./pages/RoadmapPage'))
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'))
const CodingTestPage    = lazy(() => import('./pages/CodingTestPage'))
const QuizPage          = lazy(() => import('./pages/QuizPage'))
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'))
const SoftSkillsPage    = lazy(() => import('./pages/SoftSkillsPage'))
const LeaderboardPage   = lazy(() => import('./pages/LeaderboardPage'))
const AnalyticsPage     = lazy(() => import('./pages/AnalyticsPage'))
const ReadinessCardPage = lazy(() => import('./pages/ReadinessCardPage'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center animate-pulse">
          <span className="text-white font-heading font-bold text-xl">K</span>
        </div>
        <Spinner size="md" />
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#F9FAFB' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' },
          },
        }}
      />
      <FocusOverlay />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route path="/"        element={<LandingPage />} />
            <Route path="/auth"    element={<GuestRoute><AuthPage /></GuestRoute>} />

            {/* Protected routes */}
            <Route path="/onboarding"      element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/roadmap"         element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route path="/resume"          element={<ProtectedRoute><ResumeBuilderPage /></ProtectedRoute>} />
            <Route path="/coding-test"     element={<ProtectedRoute><CodingTestPage /></ProtectedRoute>} />
            <Route path="/coding-test/:testId" element={<ProtectedRoute><CodingTestPage /></ProtectedRoute>} />
            <Route path="/quiz"            element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/quiz/:quizId"    element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/mock-interview"  element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
            <Route path="/soft-skills"     element={<ProtectedRoute><SoftSkillsPage /></ProtectedRoute>} />
            <Route path="/leaderboard"     element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/analytics"       element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/readiness-card"  element={<ProtectedRoute><ReadinessCardPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  )
}
