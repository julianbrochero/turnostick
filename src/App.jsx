import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing  from './pages/Landing'
import Login    from './pages/Login'
import Register from './pages/Register'
import Admin    from './pages/Admin'
import Booking  from './pages/Booking'
import Cancel   from './pages/Cancel'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin"    element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/b/:slug"              element={<Booking />} />
      <Route path="/cancelar/:bookingId" element={<Cancel />} />
      <Route path="*"                    element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
