import React, { Suspense, lazy, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

// Providers must be imported eagerly (they wrap the tree, not lazy routes)
import { AuthProvider } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { FocusProvider } from './context/FocusContext'

// Lazy load the main App bundle
const App = lazy(() => import('./App'))

// Minimal loading fallback - inline styles avoid CSS flash
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.125rem',
    color: '#a3a3a3'
  }}>
    Loading...
  </div>
)

// Error Boundary for catching render errors
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
    // Send to error tracking service in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Compose providers
const AppProviders = ({ children }) => (
  <AuthProvider>
    <UserProvider>
      <FocusProvider>
        {children}
      </FocusProvider>
    </UserProvider>
  </AuthProvider>
)

// Router configuration extracted for reusability
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
}

// Get root element once
const rootElement = document.getElementById('root')

// Ensure root element exists
if (!rootElement) {
  throw new Error('Root element not found')
}

// Create root and render
const root = ReactDOM.createRoot(rootElement)

root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={routerFutureConfig}>
        <AppProviders>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept()
}