import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Icons } from '../components/Icon'

const slugify = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.3c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.2-.2-1.8H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.3-2.4c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H3v2.5C4.6 19.8 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.4 14c-.2-.6-.4-1.3-.4-2V7.5H3C2.4 8.8 2 10.4 2 12s.4 3.2 1 4.5L6.4 14z" />
    <path fill="#FBBC05" d="M12 5.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C17 3.1 14.7 2 12 2 8 2 4.6 4.2 3 7.5L6.4 10C7.2 7.6 9.4 5.9 12 5.9z" />
  </svg>
)

export default function Register() {
  const { user, business, signInWithGoogle, createBusiness, updateBusiness } = useAuth()
  const navigate = useNavigate()

  const [biz, setBiz]               = useState({ name: '', slug: '', address: '', phone: '' })
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [startingTrial, setStartingTrial]   = useState(false)

  // Si ya tiene negocio con trial activo → admin (ej. recarga de página)
  useEffect(() => {
    if (user && business && business.trial_ends_at) navigate('/admin', { replace: true })
  }, [user, business])

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('No se pudo conectar con Google. Intentá de nuevo.')
      setGoogleLoading(false)
    }
  }

  const handleBusiness = async (e) => {
    e.preventDefault()
    if (!biz.slug) return setError('La URL es requerida')
    setError('')
    setLoading(true)
    try {
      await createBusiness(biz)
      // Mostrar modal para iniciar prueba — NO navegar todavía
      setShowTrialModal(true)
    } catch (err) {
      if (err.code === '23505') setError('Esa URL ya está en uso, elegí otra')
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setStartingTrial(true)
    try {
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await updateBusiness({ trial_ends_at: trialEndsAt })
      navigate('/admin', { replace: true })
    } catch {
      navigate('/admin', { replace: true })
    }
  }

  // ── Sin sesión: pantalla de Google ───────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="turnoStick" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta gratis</h1>
          <p className="text-sm text-slate-500 mt-1">7 días gratis · Sin tarjeta de crédito</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-60">
            {googleLoading
              ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <GoogleIcon />}
            {googleLoading ? 'Redirigiendo...' : 'Registrarse con Google'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Al continuar aceptás los términos de uso
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Ingresar</Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-slate-400 hover:text-slate-600 text-xs">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )

  // ── Modal de inicio de prueba ──────────────────────────────────────────────
  if (showTrialModal) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 bg-[#31393C] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <img src="/logo.png" alt="turnoStick" className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Tu negocio está listo!</h1>
        <p className="text-slate-500 text-sm mb-1">Tenés <strong className="text-slate-900">7 días gratis</strong> para probar todo.</p>
        <p className="text-slate-400 text-xs mb-8">La prueba arranca cuando hagas clic.</p>

        <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-3">
          {[
            'Reservas ilimitadas',
            'Pagos anticipados online',
            'Recordatorios automáticos',
            'Sin tarjeta de crédito',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
              <div className="w-5 h-5 bg-[#31393C] rounded-full flex items-center justify-center shrink-0">
                <Icon d={Icons.check} size={10} stroke="#AAFF00" />
              </div>
              {f}
            </div>
          ))}
        </div>

        <button onClick={handleStartTrial} disabled={startingTrial}
          className="w-full py-3.5 bg-[#31393C] text-indigo-600 font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 text-sm">
          {startingTrial ? 'Iniciando...' : 'Iniciar prueba gratis →'}
        </button>
        <p className="text-xs text-slate-400 mt-3">Después $14.999 ARS/mes · Cancelá cuando quieras</p>
      </div>
    </div>
  )

  // ── Con sesión pero sin negocio: configurar negocio ──────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="turnoStick" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">¡Último paso!</h1>
          <p className="text-sm text-slate-500 mt-1">Configurá tu página de reservas</p>
        </div>

        <form onSubmit={handleBusiness} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio *</label>
            <input type="text" value={biz.name} required placeholder="Ej: Peluquería Ana"
              onChange={e => setBiz(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">URL de tu página *</label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-300">
              <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs border-r border-slate-200 whitespace-nowrap">turnostick.com/b/</span>
              <input type="text" value={biz.slug} required
                onChange={e => setBiz(p => ({ ...p, slug: slugify(e.target.value) }))}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            {biz.slug && <p className="text-xs text-indigo-600 mt-1">turnostick.com/b/{biz.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
            <input type="tel" value={biz.phone} placeholder="+54 11 1234-5678"
              onChange={e => setBiz(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
            <input type="text" value={biz.address} placeholder="Av. Corrientes 1234, CABA"
              onChange={e => setBiz(p => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#31393C] text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors disabled:opacity-60">
            {loading ? 'Creando negocio...' : 'Continuar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
