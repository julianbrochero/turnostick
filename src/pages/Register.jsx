import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Icons } from '../components/Icon'

const slugify = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export default function Register() {
  const { user, business, signUp, createBusiness } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]         = useState(1)
  const [form, setForm]         = useState({ email: '', password: '', confirm: '' })
  const [biz, setBiz]           = useState({ name: '', slug: '', address: '', phone: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Si ya tiene usuario y negocio → ir al admin
  // Si tiene usuario pero no negocio → saltar al paso 2
  useEffect(() => {
    if (user && business) navigate('/admin', { replace: true })
    else if (user && !business) setStep(2)
  }, [user, business])

  const handleAccount = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    if (form.password.length < 6)       return setError('La contraseña debe tener al menos 6 caracteres')
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password)
      setStep(2)
    } catch (err) {
      setError(err.message === 'User already registered' ? 'Este email ya está registrado' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBusiness = async (e) => {
    e.preventDefault()
    if (!biz.slug) return setError('La URL es requerida')
    setError('')
    setLoading(true)
    try {
      await createBusiness(biz)
      navigate('/admin')
    } catch (err) {
      if (err.code === '23505') setError('Esa URL ya está en uso, elegí otra')
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon d={Icons.scissors} size={20} stroke="white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Crear cuenta' : 'Tu negocio'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 ? 'Gratis, sin tarjeta de crédito' : 'Configurá tu página de reservas'}
          </p>
        </div>

        {/* Steps */}
        <div className="flex gap-3 mb-6">
          {['Cuenta', 'Negocio'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i + 1 <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <div className={`text-xs mt-1 text-center font-medium ${i + 1 <= step ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step 1 — Cuenta */}
        {step === 1 && (
          <form onSubmit={handleAccount} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input type="password" value={form.confirm} required
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loading ? 'Creando cuenta...' : 'Continuar →'}
            </button>
          </form>
        )}

        {/* Step 2 — Negocio */}
        {step === 2 && (
          <form onSubmit={handleBusiness} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio *</label>
              <input type="text" value={biz.name} required
                placeholder="Ej: Peluquería Ana"
                onChange={e => setBiz(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">URL de tu página de reservas</label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300">
                <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs border-r border-slate-200 whitespace-nowrap">turnostick.com/b/</span>
                <input type="text" value={biz.slug} required
                  onChange={e => setBiz(p => ({ ...p, slug: slugify(e.target.value) }))}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              {biz.slug && (
                <p className="text-xs text-indigo-600 mt-1">turnostick.com/b/{biz.slug}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
              <input type="tel" value={biz.phone} placeholder="+54 11 1234-5678"
                onChange={e => setBiz(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
              <input type="text" value={biz.address} placeholder="Av. Corrientes 1234, CABA"
                onChange={e => setBiz(p => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loading ? 'Creando negocio...' : '¡Empezar ahora! →'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Ingresar</Link>
        </p>
      </div>
    </div>
  )
}
