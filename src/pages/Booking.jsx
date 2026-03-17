import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Icon, Icons } from '../components/Icon'

const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const fmt   = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const today = () => new Date().toISOString().split('T')[0]

export default function Booking() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [business, setBusiness] = useState(null)
  const [services, setServices] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(true)

  const [step, setStep]       = useState(1)
  const [selected, setSelected] = useState({ service: null, date: today(), time: null, name: '', email: '', phone: '', payOnline: false })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchBusiness() }, [slug])

  const fetchBusiness = async () => {
    const { data: biz, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !biz) { setNotFound(true); setLoading(false); return }
    setBusiness(biz)

    const { data: svcs } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', biz.id)
      .eq('active', true)
      .order('name')
    setServices(svcs || [])
    setLoading(false)
  }

  const days = [...Array(14)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const fmtDay = (d) => {
    const dt = new Date(d + 'T12:00')
    return { day: dt.toLocaleDateString('es-AR', { weekday: 'short' }), num: dt.getDate(), month: dt.toLocaleDateString('es-AR', { month: 'short' }) }
  }

  const canNext = () => {
    if (step === 1) return !!selected.service
    if (step === 2) return !!(selected.date && selected.time)
    if (step === 3) return !!(selected.name && selected.email)
    return true
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    const svc = services.find(s => s.id === selected.service)
    const { error } = await supabase.from('bookings').insert({
      business_id:  business.id,
      service_id:   selected.service,
      client_name:  selected.name,
      client_email: selected.email,
      client_phone: selected.phone,
      date:   selected.date,
      time:   selected.time,
      status: 'pending',
      paid:   selected.payOnline,
      amount: svc?.price || 0,
    })
    setSubmitting(false)
    if (!error) setStep(5)
  }

  const svc = services.find(s => s.id === selected.service)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Página no encontrada</h1>
        <p className="text-slate-500 text-sm mb-6">No existe ningún negocio con esa URL</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Icon d={Icons.scissors} size={14} stroke="white" />
          </div>
          <span className="font-bold text-slate-900">{business?.name}</span>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Icon d={Icons.home} size={15} /> Inicio
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Stepper */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['Servicio','Fecha','Datos','Pago'].map((label, i) => (
                <div key={label} className={`flex items-center gap-1 text-xs font-medium ${i + 1 <= step ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? 'bg-indigo-600 text-white' : i + 1 === step ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1 < step ? <Icon d={Icons.check} size={12} stroke="white" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-slate-200 rounded-full">
              <div className="h-1 bg-indigo-600 rounded-full transition-all" style={{ width: `${((step - 1) / 3) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {/* Step 1 — Servicio */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Elegí un servicio</h2>
              <p className="text-sm text-slate-500 mb-6">Seleccioná el servicio que querés reservar</p>
              {services.length === 0
                ? <p className="text-slate-400 text-sm text-center py-8">Este negocio aún no tiene servicios disponibles</p>
                : <div className="grid gap-3">
                    {services.map(s => (
                      <button key={s.id} onClick={() => setSelected(p => ({ ...p, service: s.id }))}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selected.service === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '20' }}>
                            <Icon d={Icons.scissors} size={18} stroke={s.color} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Icon d={Icons.clock} size={11} stroke="#94a3b8" /> {s.duration} min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{fmt(s.price)}</div>
                          {selected.service === s.id && (
                            <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center ml-auto mt-1">
                              <Icon d={Icons.check} size={10} stroke="white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* Step 2 — Fecha y hora */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Elegí fecha y hora</h2>
              <p className="text-sm text-slate-500 mb-5">Seleccioná cuándo querés tu turno</p>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
                {days.map(d => {
                  const { day, num, month } = fmtDay(d)
                  return (
                    <button key={d} onClick={() => setSelected(p => ({ ...p, date: d, time: null }))}
                      className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all ${selected.date === d ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <span className="text-xs text-slate-500 capitalize">{day}</span>
                      <span className={`text-lg font-bold ${selected.date === d ? 'text-indigo-600' : 'text-slate-900'}`}>{num}</span>
                      <span className="text-xs text-slate-400 capitalize">{month}</span>
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map(t => (
                  <button key={t} onClick={() => setSelected(p => ({ ...p, time: t }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${selected.time === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Datos */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Tus datos</h2>
              <p className="text-sm text-slate-500 mb-6">Para enviarte la confirmación</p>
              <div className="space-y-4">
                {[
                  { label: 'Nombre completo *', key: 'name',  type: 'text',  placeholder: 'Ej: María García' },
                  { label: 'Email *',           key: 'email', type: 'email', placeholder: 'tu@email.com' },
                  { label: 'Teléfono',          key: 'phone', type: 'tel',   placeholder: '+54 9 11 1234-5678' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input type={type} placeholder={placeholder} value={selected[key]}
                      onChange={e => setSelected(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Pago */}
          {step === 4 && svc && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Método de pago</h2>
              <p className="text-sm text-slate-500 mb-5">Podés pagar ahora o al momento del turno</p>
              <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm">
                <div className="font-semibold text-slate-900 mb-2">Resumen del turno</div>
                <div className="flex justify-between text-slate-600 mb-1"><span>{svc.name}</span><span>{fmt(svc.price)}</span></div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>{new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span>{selected.time} hs</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { id: true,  icon: '💳', label: 'Pagar online ahora', desc: 'Tarjeta de crédito / débito' },
                  { id: false, icon: '🏦', label: 'Pagar en el local',  desc: 'Efectivo o transferencia' },
                ].map(({ id, icon, label, desc }) => (
                  <button key={String(id)} onClick={() => setSelected(p => ({ ...p, payOnline: id }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selected.payOnline === id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <span className="text-2xl">{icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-sm">{label}</div>
                      <div className="text-xs text-slate-500">{desc}</div>
                    </div>
                    {selected.payOnline === id && (
                      <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Icon d={Icons.check} size={11} stroke="white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Confirmado */}
          {step === 5 && svc && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon d={Icons.check} size={30} stroke="#10b981" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Turno confirmado!</h2>
              <p className="text-slate-500 text-sm mb-6">Te enviamos los detalles a <strong>{selected.email}</strong></p>
              <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 mb-6">
                {[
                  ['Negocio',     business.name],
                  ['Servicio',    svc.name],
                  ['Fecha',       new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                  ['Hora',        selected.time + ' hs'],
                  ['Total',       fmt(svc.price)],
                  ['Estado pago', selected.payOnline ? '✅ Pagado online' : '⏳ Pagar en el local'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setStep(1); setSelected({ service: null, date: today(), time: null, name: '', email: '', phone: '', payOnline: false }) }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors mb-2">
                Reservar otro turno
              </button>
              <button onClick={() => navigate('/')} className="text-sm text-indigo-600 hover:underline">Volver al inicio</button>
            </div>
          )}

          {/* Navegación */}
          {step < 5 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                  ← Volver
                </button>
              )}
              <button
                onClick={() => step < 4 ? setStep(s => s + 1) : confirmBooking()}
                disabled={!canNext() || submitting}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${canNext() && !submitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {submitting ? 'Confirmando...' : step === 4 ? (selected.payOnline ? 'Confirmar y pagar' : 'Confirmar reserva') : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
