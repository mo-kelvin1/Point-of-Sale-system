import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CashierPage from './pages/CashierPage'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    // Send cashiers to their page, others to dashboard
    return <Navigate to={user?.role === 'CASHIER' ? '/cashier' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { token, user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to={user?.role === 'CASHIER' ? '/cashier' : '/dashboard'} replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/cashier" element={
        <ProtectedRoute roles={['CASHIER']}>
          <CashierPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={token ? (user?.role === 'CASHIER' ? '/cashier' : '/dashboard') : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
