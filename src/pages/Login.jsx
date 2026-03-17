import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Icons } from '../components/Icon'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.3c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.2-.2-1.8H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.3-2.4c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H3v2.5C4.6 19.8 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.4 14c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.5H3C2.4 8.8 2 10.4 2 12s.4 3.2 1 4.5L6.4 14z" />
    <path fill="#FBBC05" d="M12 5.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C17 3.1 14.7 2 12 2 8 2 4.6 4.2 3 7.5L6.4 10C7.2 7.6 9.4 5.9 12 5.9z" />
  </svg>
)

export default function Login() {
  const { user, business, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (user && business)  navigate('/admin',    { replace: true })
    else if (user && !business) navigate('/register', { replace: true })
  }, [user, business])

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      // La redirección la maneja Supabase → vuelve a /register
    } catch (err) {
      setError('No se pudo conectar con Google. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Icon d={Icons.scissors} size={22} stroke="white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">turnoStick</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresá a tu panel de administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Al continuar aceptás los términos de uso de turnoStick
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">Registrate gratis</Link>
        </p>
        <p className="text-center text-sm mt-2">
          <Link to="/" className="text-slate-400 hover:text-slate-600 text-xs">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
