import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Icons } from '../components/Icon'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

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
          <button type="submit" disabled={loading}
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
