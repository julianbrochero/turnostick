import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Icon, Icons } from '../components/Icon'

const fmt   = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const today = () => new Date().toISOString().split('T')[0]

// Genera slots cada `interval` minutos entre open y close
const generateSlots = (openTime, closeTime, interval = 30) => {
  const slots = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`)
    cur += interval
  }
  return slots
}

// Devuelve los slots disponibles para una fecha concreta
const getSlotsForDate = (date, schedules, overrides) => {
  const override = overrides.find(o => o.date === date)
  if (override) {
    if (!override.is_open) return []
    return generateSlots(override.open_time, override.close_time)
  }
  const dow = new Date(date + 'T12:00').getDay()
  const sch = schedules.find(s => s.day_of_week === dow)
  if (!sch || !sch.is_open) return []
  return generateSlots(sch.open_time, sch.close_time)
}

export default function Booking() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [business, setBusiness]   = useState(null)
  const [services, setServices]   = useState([])
  const [schedules, setSchedules] = useState([])
  const [overrides, setOverrides] = useState([])
  const [notFound, setNotFound]   = useState(false)
  const [loading, setLoading]     = useState(true)

  const [step, setStep]         = useState(1)
  const [selected, setSelected] = useState({ service: null, date: today(), time: null, name: '', email: '', phone: '', payMethod: '' })
  const [submitting, setSubmitting] = useState(false)
  const [mpLoading, setMpLoading]   = useState(false)

  // Check MP redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const bid     = params.get('bid')
    if (payment === 'success' && bid) {
      setStep(5)
      setSelected(p => ({ ...p, payMethod: 'mercadopago', confirmedBid: bid }))
    }
  }, [])

  useEffect(() => { fetchBusiness() }, [slug])

  const fetchBusiness = async () => {
    const { data: biz, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !biz) { setNotFound(true); setLoading(false); return }
    setBusiness(biz)

    const [svcsRes, schRes, ovRes] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', biz.id).eq('active', true).order('name'),
      supabase.from('schedules').select('*').eq('business_id', biz.id),
      supabase.from('schedule_overrides').select('*').eq('business_id', biz.id).gte('date', today()),
    ])
    setServices(svcsRes.data || [])
    setSchedules(schRes.data || [])
    setOverrides(ovRes.data || [])
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
    if (step === 4) return !!selected.payMethod
    return true
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    const svc = services.find(s => s.id === selected.service)
    const isMp = selected.payMethod === 'mercadopago'

    const { data: booking, error } = await supabase.from('bookings').insert({
      business_id:    business.id,
      service_id:     selected.service,
      client_name:    selected.name,
      client_email:   selected.email,
      client_phone:   selected.phone,
      date:           selected.date,
      time:           selected.time,
      status:         isMp ? 'pending_payment' : 'pending',
      paid:           false,
      amount:         svc?.price || 0,
      payment_method: selected.payMethod,
      payment_status: isMp ? 'pending' : 'unpaid',
    }).select().single()

    setSubmitting(false)
    if (error) { alert('Error al reservar, intentá de nuevo'); return }

    if (isMp) {
      setMpLoading(true)
      const { data, error: fnErr } = await supabase.functions.invoke('create-mp-preference', {
        body: { booking_id: booking.id, business_id: business.id },
      })
      setMpLoading(false)
      if (fnErr || !data?.init_point) { alert('Error al iniciar pago, intentá de nuevo'); return }
      window.location.href = data.init_point
    } else {
      setStep(5)
    }
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
          {step === 2 && (() => {
            const slots = getSlotsForDate(selected.date, schedules, overrides)
            const isClosedDay = slots.length === 0
            return (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Elegí fecha y hora</h2>
                <p className="text-sm text-slate-500 mb-5">Seleccioná cuándo querés tu turno</p>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
                  {days.map(d => {
                    const { day, num, month } = fmtDay(d)
                    const daySlots = getSlotsForDate(d, schedules, overrides)
                    const closed   = daySlots.length === 0
                    return (
                      <button key={d} onClick={() => !closed && setSelected(p => ({ ...p, date: d, time: null }))}
                        disabled={closed}
                        className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all ${closed ? 'border-slate-100 opacity-40 cursor-not-allowed' : selected.date === d ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <span className="text-xs text-slate-500 capitalize">{day}</span>
                        <span className={`text-lg font-bold ${selected.date === d ? 'text-indigo-600' : 'text-slate-900'}`}>{num}</span>
                        <span className="text-xs text-slate-400 capitalize">{month}</span>
                      </button>
                    )
                  })}
                </div>
                {isClosedDay
                  ? <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-slate-500 text-sm font-medium">No hay turnos disponibles este día</p>
                      <p className="text-slate-400 text-xs mt-1">Seleccioná otra fecha</p>
                    </div>
                  : <div className="grid grid-cols-4 gap-2">
                      {slots.map(t => (
                        <button key={t} onClick={() => setSelected(p => ({ ...p, time: t }))}
                          className={`py-2 rounded-lg text-sm font-medium border transition-all ${selected.time === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                }
              </div>
            )
          })()}

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
          {step === 4 && svc && (() => {
            const hasMp       = business.sena_amount > 0 && business.mp_access_token
            const hasTransfer = business.bank_cbu || business.bank_alias
            return (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Método de pago</h2>
                <p className="text-sm text-slate-500 mb-5">Elegí cómo querés pagar</p>

                {/* Resumen */}
                <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm">
                  <div className="font-semibold text-slate-900 mb-2">Resumen del turno</div>
                  <div className="flex justify-between text-slate-600 mb-1"><span>{svc.name}</span><span>{fmt(svc.price)}</span></div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>{new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span>{selected.time} hs</span>
                  </div>
                  {hasMp && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-slate-700">
                      <span className="text-xs">Seña a pagar ahora</span>
                      <span className="font-semibold text-xs">{fmt(business.sena_amount)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* MercadoPago */}
                  {hasMp && (
                    <button onClick={() => setSelected(p => ({ ...p, payMethod: 'mercadopago' }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selected.payMethod === 'mercadopago' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <span className="text-2xl">💳</span>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-slate-900 text-sm">Pagar seña con MercadoPago</div>
                        <div className="text-xs text-slate-500">Tarjeta de crédito / débito · {fmt(business.sena_amount)}</div>
                      </div>
                      {selected.payMethod === 'mercadopago' && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <Icon d={Icons.check} size={11} stroke="white" />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Transferencia */}
                  {hasTransfer && (
                    <button onClick={() => setSelected(p => ({ ...p, payMethod: 'transfer' }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected.payMethod === 'transfer' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🏦</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-sm">Transferencia bancaria</div>
                          <div className="text-xs text-slate-500">Enviá la seña antes del turno</div>
                        </div>
                        {selected.payMethod === 'transfer' && (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <Icon d={Icons.check} size={11} stroke="white" />
                          </div>
                        )}
                      </div>
                      {selected.payMethod === 'transfer' && (
                        <div className="mt-3 bg-white rounded-lg p-3 space-y-1.5 border border-slate-100">
                          {business.bank_alias  && <div className="flex justify-between text-xs"><span className="text-slate-500">Alias</span><span className="font-semibold text-slate-800">{business.bank_alias}</span></div>}
                          {business.bank_cbu    && <div className="flex justify-between text-xs"><span className="text-slate-500">CBU</span><span className="font-mono text-slate-800">{business.bank_cbu}</span></div>}
                          {business.bank_holder && <div className="flex justify-between text-xs"><span className="text-slate-500">Titular</span><span className="font-semibold text-slate-800">{business.bank_holder}</span></div>}
                          {business.bank_bank   && <div className="flex justify-between text-xs"><span className="text-slate-500">Banco</span><span className="text-slate-800">{business.bank_bank}</span></div>}
                          {hasMp && <div className="flex justify-between text-xs pt-1 border-t border-slate-100"><span className="text-slate-500">Monto de seña</span><span className="font-semibold text-indigo-600">{fmt(business.sena_amount)}</span></div>}
                        </div>
                      )}
                    </button>
                  )}

                  {/* Pagar en el local */}
                  <button onClick={() => setSelected(p => ({ ...p, payMethod: 'local' }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selected.payMethod === 'local' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <span className="text-2xl">🏠</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-slate-900 text-sm">Pagar en el local</div>
                      <div className="text-xs text-slate-500">Efectivo o como prefieras el día del turno</div>
                    </div>
                    {selected.payMethod === 'local' && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <Icon d={Icons.check} size={11} stroke="white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )
          })()}

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
                  ['Estado pago', selected.payMethod === 'mercadopago' ? '✅ Seña pagada con MercadoPago' : selected.payMethod === 'transfer' ? '🏦 Seña por transferencia — pendiente confirmación' : '🏠 Pago en el local'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setStep(1); setSelected({ service: null, date: today(), time: null, name: '', email: '', phone: '', payMethod: '' }) }}
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
                disabled={!canNext() || submitting || mpLoading}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${canNext() && !submitting && !mpLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {submitting || mpLoading ? (mpLoading ? 'Redirigiendo a MercadoPago...' : 'Confirmando...') : step === 4 ? (selected.payMethod === 'mercadopago' ? 'Confirmar y pagar seña →' : 'Confirmar reserva →') : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
