import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './components/ui/Toast'
import Login from './pages/Login'
import Register from './pages/Register'
import EscordApp from './pages/App'
import Landing from './pages/Landing'

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
  if (!session) return <Navigate to="/login" />
  return children
}

// Auth Route Wrapper (redirect to app if already logged in)
function AuthRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
  if (session) return <Navigate to="/app" />
  return children
}

// Landing Route Wrapper
function LandingRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
  if (session) return <Navigate to="/app" />
  return children
}

function Main() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
              <Route path="/app" element={<ProtectedRoute><EscordApp /></ProtectedRoute>} />
            </Routes>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement._reactRootContainer && !rootElement.__reactContainer$) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Main />
    </React.StrictMode>,
  )
}
