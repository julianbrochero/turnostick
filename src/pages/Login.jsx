import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Icons } from '../components/Icon'

export default function Login() {
  const { user, business, signIn, signInWithGoogle } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (user && business) navigate('/admin', { replace: true })
    else if (user && !business) navigate('/register', { replace: true })
  }, [user, business, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'No se pudo continuar con Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon d={Icons.scissors} size={20} stroke="white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ingresar</h1>
          <p className="text-sm text-slate-500 mt-1">Accedé a tu panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
          <button type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading}
            className="w-full py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.3c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.2-.2-1.8H12z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.3-2.4c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H3v2.5C4.6 19.8 8 22 12 22z" />
              <path fill="#4A90E2" d="M6.4 14c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.5H3C2.4 8.8 2 10.4 2 12s.4 3.2 1 4.5L6.4 14z" />
              <path fill="#FBBC05" d="M12 5.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C17 3.1 14.7 2 12 2 8 2 4.6 4.2 3 7.5L6.4 10C7.2 7.6 9.4 5.9 12 5.9z" />
            </svg>
            {googleLoading ? 'Redirigiendo a Google...' : 'Continuar con Google'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">o con email</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} required
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input type="password" value={form.password} required
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <button type="submit" disabled={loading || googleLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">Registrate gratis</Link>
        </p>
        <p className="text-center text-sm mt-2">
          <Link to="/" className="text-slate-400 hover:text-slate-600">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
