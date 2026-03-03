import { Suspense, lazy, memo, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Spinner from './components/ui/Spinner';
import FocusOverlay from './components/focus/FocusOverlay';

// ============================================
// ROUTE CONFIGURATION (Data-driven approach)
// ============================================
const ROUTE_CONFIG = {
  // Public routes - accessible by anyone
  public: [
    { path: '/', name: 'landing' },
  ],
  
  // Guest routes - only for unauthenticated users
  guest: [
    { path: '/auth', name: 'auth' },
  ],
  
  // Protected routes - require authentication
  protected: [
    { path: '/onboarding', name: 'onboarding' },
    { path: '/dashboard', name: 'dashboard' },
    { path: '/roadmap', name: 'roadmap' },
    { path: '/resume', name: 'resume' },
    { path: '/coding-test/:testId?', name: 'codingTest' },
    { path: '/quiz/:quizId?', name: 'quiz' },
    { path: '/mock-interview', name: 'mockInterview' },
    { path: '/soft-skills', name: 'softSkills' },
    { path: '/leaderboard', name: 'leaderboard' },
    { path: '/analytics', name: 'analytics' },
    { path: '/readiness-card', name: 'readinessCard' },
  ],
};

// ============================================
// LAZY IMPORTS WITH FACTORY PATTERN
// ============================================
const createLazyPage = (importFn) => {
  const Component = lazy(importFn);
  Component.preload = importFn;
  return Component;
};

const Pages = {
  landing: createLazyPage(() => import('./pages/LandingPage')),
  auth: createLazyPage(() => import('./pages/AuthPage')),
  onboarding: createLazyPage(() => import('./pages/OnboardingPage')),
  dashboard: createLazyPage(() => import('./pages/DashboardPage')),
  roadmap: createLazyPage(() => import('./pages/RoadmapPage')),
  resume: createLazyPage(() => import('./pages/ResumeBuilderPage')),
  codingTest: createLazyPage(() => import('./pages/CodingTestPage')),
  quiz: createLazyPage(() => import('./pages/QuizPage')),
  mockInterview: createLazyPage(() => import('./pages/MockInterviewPage')),
  softSkills: createLazyPage(() => import('./pages/SoftSkillsPage')),
  leaderboard: createLazyPage(() => import('./pages/LeaderboardPage')),
  analytics: createLazyPage(() => import('./pages/AnalyticsPage')),
  readinessCard: createLazyPage(() => import('./pages/ReadinessCardPage')),
};

// ============================================
// PRELOAD UTILITIES
// ============================================
const preloadedPages = new Set();

export const preloadPage = (pageName) => {
  if (preloadedPages.has(pageName) || !Pages[pageName]?.preload) return;
  
  preloadedPages.add(pageName);
  Pages[pageName].preload();
};

export const preloadPages = (...pageNames) => {
  pageNames.forEach(preloadPage);
};

// Schedules preloading during browser idle time
const schedulePreload = (callback, fallbackDelay = 2000) => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(callback, { timeout: 3000 });
  } else {
    setTimeout(callback, fallbackDelay);
  }
};

// Preload critical routes after initial page load
if (typeof window !== 'undefined') {
  const handleLoad = () => {
    schedulePreload(() => preloadPages('dashboard', 'roadmap'));
  };
  
  window.addEventListener('load', handleLoad, { once: true });
}

// ============================================
// TOAST CONFIGURATION
// ============================================
const TOAST_CONFIG = {
  position: 'top-right',
  gutter: 8,
  toastOptions: {
    duration: 4000,
    style: {
      background: '#1F2937',
      color: '#F9FAFB',
      border: '1px solid #374151',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
    success: { iconTheme: { primary: '#10B981', secondary: '#F9FAFB' } },
    error: { iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' } },
  },
};

// ============================================
// UI COMPONENTS
// ============================================
const PageLoader = memo(function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center animate-pulse">
          <span className="text-white font-heading font-bold text-xl">K</span>
        </div>
        <Spinner size="md" />
      </div>
    </div>
  );
});

// ============================================
// AUTH LAYOUT WRAPPERS
// ============================================
const AuthGuard = memo(function AuthGuard({ requireAuth, redirectTo }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  // Check auth state based on requirement
  const shouldRedirect = requireAuth ? !user : user;
  
  if (shouldRedirect) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
});

// Convenience wrappers for clearer intent
const ProtectedLayout = memo(function ProtectedLayout() {
  return <AuthGuard requireAuth redirectTo="/auth" />;
});

const GuestLayout = memo(function GuestLayout() {
  return <AuthGuard requireAuth={false} redirectTo="/dashboard" />;
});

// ============================================
// ROUTE RENDERER
// ============================================
const renderRoutes = (routes) => {
  return routes.map(({ path, name }) => {
    const PageComponent = Pages[name];
    return <Route key={path} path={path} element={<PageComponent />} />;
  });
};

// ============================================
// ANIMATED ROUTES
// ============================================
const AnimatedRoutes = memo(function AnimatedRoutes() {
  const location = useLocation();
  
  // Extract base path for consistent animation keys
  const routeKey = location.pathname.split('/')[1] || 'home';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={routeKey}>
        {/* Public routes */}
        {renderRoutes(ROUTE_CONFIG.public)}
        
        {/* Guest-only routes */}
        <Route element={<GuestLayout />}>
          {renderRoutes(ROUTE_CONFIG.guest)}
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          {renderRoutes(ROUTE_CONFIG.protected)}
        </Route>

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
});

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  return (
    <>
      <Toaster {...TOAST_CONFIG} />
      <FocusOverlay />
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </>
  );
}

// ============================================
// PRELOAD LINK COMPONENT
// ============================================
export const PreloadLink = memo(function PreloadLink({ 
  to, 
  pageName, 
  children,
  as: Component = 'a',
  ...props 
}) {
  const handlePreload = useCallback(() => {
    if (pageName) preloadPage(pageName);
  }, [pageName]);

  return (
    <Component
      href={to}
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
      {...props}
    >
      {children}
    </Component>
  );
});

// ============================================
// HOOK: usePagePreload - Preload on mount/effect
// ============================================
export const usePagePreload = (pageNames) => {
  useEffect(() => {
    const names = Array.isArray(pageNames) ? pageNames : [pageNames];
    schedulePreload(() => preloadPages(...names));
  }, [pageNames]);
};