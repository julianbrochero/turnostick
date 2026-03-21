import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Icon, Icons } from '../components/Icon'
import Logo from '../components/Logo'

const fmt   = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const today = () => new Date().toISOString().split('T')[0]

const copyText = (text, onDone) => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => {
      const el = document.createElement('textarea')
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0'
      document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
      onDone?.()
    })
  } else {
    const el = document.createElement('textarea')
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0'
    document.body.appendChild(el); el.select()
    document.execCommand('copy'); document.body.removeChild(el)
    onDone?.()
  }
}

const timeToMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

// Genera slots cada `interval` minutos entre open y close
// Solo muestra slots donde el servicio entra completo antes del cierre
const generateSlots = (openTime, closeTime, interval = 30) => {
  const slots = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur + interval <= end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`)
    cur += interval
  }
  return slots
}

// Devuelve los slots disponibles para una fecha concreta
// serviceMap: { [service_id]: { duration, quantity } } para solapamientos y capacidad
const getSlotsForDate = (date, schedules, overrides, blockedSlots = [], recurringBlocked = [], bookedSlots = [], serviceDuration = 30, serviceMap = {}, serviceQuantity = 1) => {
  const override = overrides.find(o => o.date === date)
  let slots
  if (override) {
    if (!override.is_open) return []
    slots = generateSlots(override.open_time, override.close_time, serviceDuration)
  } else {
    const dow = new Date(date + 'T12:00').getDay()
    const sch = schedules.find(s => s.day_of_week === dow)
    if (!sch || !sch.is_open) return []
    slots = generateSlots(sch.open_time, sch.close_time, serviceDuration)
  }
  const dow = new Date(date + 'T12:00').getDay()

  // Para hoy: calcular minutos actuales y filtrar slots ya pasados
  const isToday = date === today()
  const nowMins = isToday
    ? (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() })()
    : -1

  const fixedBlocked = new Set([
    ...blockedSlots.filter(b => b.date === date).map(b => b.time),
    ...recurringBlocked.filter(b => b.day_of_week === dow).map(b => b.time),
  ])

  const dayBookings = bookedSlots.filter(b => b.date === date)

  return slots.filter(slot => {
    const slotStart = timeToMins(slot)
    // Ocultar slots pasados para hoy
    if (isToday && slotStart <= nowMins) return false
    if (fixedBlocked.has(slot)) return false
    const slotEnd = slotStart + serviceDuration
    // Contar bookings del mismo servicio que se solapan con este slot
    const overlapCount = dayBookings.filter(b => {
      const bDuration = serviceMap[b.service_id]?.duration || serviceDuration
      const bStart    = timeToMins(b.time)
      const bEnd      = bStart + bDuration
      return slotStart < bEnd && bStart < slotEnd
    }).length
    // Disponible si hay capacidad libre (quantity > bookings solapados)
    return overlapCount < serviceQuantity
  })
}

export default function Booking() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [business, setBusiness]   = useState(null)
  const [services, setServices]   = useState([])
  const [schedules, setSchedules]   = useState([])
  const [overrides, setOverrides]   = useState([])
  const [blockedSlots, setBlockedSlots]         = useState([])
  const [recurringBlocked, setRecurringBlocked] = useState([])
  const [bookedSlots, setBookedSlots]           = useState([])  // turnos ya confirmados/pendientes
  const [notFound, setNotFound]   = useState(false)
  const [loading, setLoading]     = useState(true)

  const [step, setStep]         = useState(1)
  const [selected, setSelected] = useState({ service: null, date: today(), time: null, name: '', email: '', phone: '', payMethod: '' })
  const [submitting, setSubmitting] = useState(false)
  const [mpLoading, setMpLoading]   = useState(false)
  const [reservationId, setReservationId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  const handleCopy = (text, field) => copyText(text, () => {
    setCopiedField(field); setTimeout(() => setCopiedField(null), 1800)
  })

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

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const [svcsRes, schRes, ovRes, blRes, rbRes, bkRes] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', biz.id).eq('active', true).order('name'),
      supabase.from('schedules').select('*').eq('business_id', biz.id),
      supabase.from('schedule_overrides').select('*').eq('business_id', biz.id).gte('date', today()),
      supabase.from('blocked_slots').select('*').eq('business_id', biz.id).gte('date', today()),
      supabase.from('recurring_blocked_slots').select('*').eq('business_id', biz.id),
      supabase.from('bookings').select('date, time, status, created_at, service_id')
        .eq('business_id', biz.id).neq('status', 'cancelled').gte('date', today()),
    ])
    setServices(svcsRes.data || [])
    setSchedules(schRes.data || [])
    setOverrides(ovRes.data || [])
    setBlockedSlots(blRes.data || [])
    setRecurringBlocked(rbRes.data || [])
    // Filtrar: reservados activos (< 10 min) + confirmados/pendientes
    const rawBookings = bkRes.data || []
    setBookedSlots(rawBookings.filter(b =>
      b.status !== 'reserved' || new Date(b.created_at) > new Date(tenMinsAgo)
    ))
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

  // Reserva temporal del slot al pasar al paso 3
  const reserveSlot = async () => {
    const svc = services.find(s => s.id === selected.service)
    const { data, error } = await supabase.from('bookings').insert({
      business_id:    business.id,
      service_id:     selected.service,
      date:           selected.date,
      time:           selected.time,
      status:         'reserved',
      client_name:    '',
      client_email:   '',
      paid:           false,
      amount:         svc?.price || 0,
    }).select('id')
    const id = data?.[0]?.id
    if (!error && id) {
      setReservationId(id)
      // Marcarlo localmente como reservado para que otros no lo vean
      setBookedSlots(prev => [...prev, { date: selected.date, time: selected.time, status: 'reserved', created_at: new Date().toISOString(), service_id: selected.service }])
    }
    return { error }
  }

  // Libera el hold si el usuario retrocede o abandona
  const releaseSlot = async (id) => {
    const rid = id ?? reservationId
    if (!rid) return
    await supabase.from('bookings').delete().eq('id', rid)
    setReservationId(null)
    setBookedSlots(prev => prev.filter(b => !(b.date === selected.date && b.time === selected.time && b.status === 'reserved')))
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    const svc = services.find(s => s.id === selected.service)
    const isMp = selected.payMethod === 'mercadopago'

    // Actualizar la reserva temporal → booking real
    const payload = {
      client_name:    selected.name,
      client_email:   selected.email,
      client_phone:   selected.phone,
      status:         isMp ? 'pending_payment' : 'pending',
      paid:           false,
      amount:         svc?.price || 0,
      payment_method: selected.payMethod,
      payment_status: isMp ? 'pending' : 'unpaid',
    }
    let booking, error
    if (reservationId) {
      const { error: updateError } = await supabase.from('bookings').update(payload).eq('id', reservationId)
      booking = { id: reservationId, ...payload }
      error = updateError
    } else {
      const res = await supabase.from('bookings').insert({ business_id: business.id, service_id: selected.service, date: selected.date, time: selected.time, ...payload }).select('id')
      booking = res.data?.[0]; error = res.error
    }

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

  const svc         = services.find(s => s.id === selected.service)
  const svcDuration = svc?.duration || 30
  const svcQuantity = svc?.quantity || 1
  const serviceMap  = Object.fromEntries(services.map(s => [s.id, s]))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Verificar si la suscripción del negocio está activa
  const isBusinessBlocked = () => {
    if (!business) return false
    const now = new Date()
    const status = business.subscription_status || 'trial'
    if (status === 'blocked') return true
    if (status === 'active') {
      return new Date(business.subscription_expires_at) <= now
    }
    // trial — si no arrancó todavía, no bloquear
    if (!business.trial_ends_at) return false
    return new Date(business.trial_ends_at) <= now
  }

  if (isBusinessBlocked()) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Reservas no disponibles</h1>
        <p className="text-slate-600 text-sm">Este negocio tiene su cuenta suspendida temporalmente.</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Página no encontrada</h1>
        <p className="text-slate-600 text-sm mb-6">No existe ningún negocio con esa URL</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center shrink-0">
              <Logo size={32} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">{business?.name}</div>
              <div className="text-xs text-slate-800 font-semibold leading-tight tracking-wide">turnoStick</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <Icon d={Icons.home} size={13} /> Inicio
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Stepper */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['Servicio','Fecha','Datos','Pago'].map((label, i) => (
                <div key={label} className={`flex items-center gap-1 text-xs font-medium ${i + 1 <= step ? 'text-[#31393C]' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? 'bg-[#31393C] text-indigo-600' : i + 1 === step ? 'bg-indigo-600 text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1 < step ? <Icon d={Icons.check} size={12} stroke="#AAFF00" /> : i + 1}
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
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: s.color + '20' }}>
                            {s.emoji || '✂️'}
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
            const slots = getSlotsForDate(selected.date, schedules, overrides, blockedSlots, recurringBlocked, bookedSlots.filter(b => !(b.date === selected.date && b.time === selected.time && b.status === 'reserved')), svcDuration, serviceMap, svcQuantity)
            const isClosedDay = slots.length === 0
            return (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Elegí fecha y hora</h2>
                <p className="text-sm text-slate-500 mb-5">Seleccioná cuándo querés tu turno</p>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
                  {days.map(d => {
                    const { day, num, month } = fmtDay(d)
                    const daySlots = getSlotsForDate(d, schedules, overrides, blockedSlots, recurringBlocked, bookedSlots, svcDuration, serviceMap, svcQuantity)
                    const closed   = daySlots.length === 0
                    return (
                      <button key={d} onClick={() => !closed && setSelected(p => ({ ...p, date: d, time: null }))}
                        disabled={closed}
                        className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all ${closed ? 'border-slate-100 opacity-40 cursor-not-allowed' : selected.date === d ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <span className="text-xs text-slate-500 capitalize">{day}</span>
                        <span className="text-lg font-bold text-slate-900">{num}</span>
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
                          className={`py-2 rounded-lg text-sm font-medium border transition-all ${selected.time === t ? 'bg-indigo-600 text-slate-900 font-bold border-indigo-600' : 'border-slate-200 text-slate-700 hover:border-indigo-600 hover:bg-indigo-50'}`}>
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
                  { label: 'Nombre completo *', key: 'name',  type: 'text',  placeholder: 'Ej: María García', autoComplete: 'name' },
                  { label: 'Email *',           key: 'email', type: 'email', placeholder: 'tu@email.com',      autoComplete: 'email' },
                  { label: 'Teléfono',          key: 'phone', type: 'tel',   placeholder: '+54 9 11 1234-5678',autoComplete: 'tel' },
                ].map(({ label, key, type, placeholder, autoComplete }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input type={type} placeholder={placeholder} value={selected[key]} autoComplete={autoComplete}
                      onChange={e => setSelected(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Pago */}
          {step === 4 && svc && (() => {
            const hasMp       = !!(business.sena_amount > 0 && business.mp_access_token)
            const hasTransfer = !!(business.bank_cbu || business.bank_alias)
            const senaAmt     = business.sena_amount || 0

            const PayOption = ({ id, icon, title, desc }) => (
              <button onClick={() => setSelected(p => ({ ...p, payMethod: id }))}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selected.payMethod === id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selected.payMethod === id ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                  {selected.payMethod === id && <Icon d={Icons.check} size={10} stroke="white" />}
                </div>
              </button>
            )

            return (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">¿Cómo querés reservar?</h2>
                <p className="text-sm text-slate-500 mb-4">Elegí el método de pago</p>

                {/* Resumen */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{svc.name}</span><span>{fmt(svc.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span>{selected.time} hs</span>
                  </div>
                  {senaAmt > 0 && (
                    <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200 text-slate-700">
                      <span>Seña requerida</span>
                      <span className="font-bold text-indigo-600">{fmt(senaAmt)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Transferencia */}
                  {hasTransfer && (
                    <PayOption id="transfer" icon="🏦" title="Transferencia bancaria"
                      desc={`Enviá la seña${senaAmt > 0 ? ` de ${fmt(senaAmt)}` : ''} y el negocio confirma tu turno`} />
                  )}

                  {hasTransfer && selected.payMethod === 'transfer' && (
                    <p className="text-xs text-slate-500 px-1">
                      Los datos bancarios aparecen al confirmar la reserva.
                    </p>
                  )}

                  {/* MercadoPago */}
                  {hasMp && (
                    <PayOption id="mercadopago" icon="💳" title="Pagar con MercadoPago"
                      desc={`Seña de ${fmt(senaAmt)} con tarjeta de crédito o débito`} />
                  )}

                  {/* Pagar en el local — solo si no hay ningún otro método */}
                  {!hasMp && !hasTransfer && (
                    <PayOption id="local" icon="🏠" title="Pagar en el local"
                      desc="Acordás el pago directamente con el negocio" />
                  )}
                </div>
              </div>
            )
          })()}

          {/* Step 5 — Resultado */}
          {step === 5 && (
            <div className="py-4">
              {selected.payMethod === 'transfer' ? (
                /* ── Transferencia: pendiente ── */
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏦</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">¡Reserva recibida!</h2>
                    <p className="text-slate-500 text-sm">Hacé la transferencia y el negocio confirmará tu turno</p>
                  </div>

                  {/* Datos del turno */}
                  <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2 mb-4">
                    {svc && <>
                      <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium">{svc.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium">{new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-medium">{selected.time} hs</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-medium">{fmt(svc.price)}</span></div>
                    </>}
                  </div>

                  {/* Datos bancarios */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos para transferir</p>
                    {business.bank_alias && (
                      <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                        <div>
                          <div className="text-xs text-slate-400">Alias</div>
                          <div className="font-bold text-slate-900 text-sm">{business.bank_alias}</div>
                        </div>
                        <button onClick={() => handleCopy(business.bank_alias, 'alias')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copiedField === 'alias' ? 'bg-[#31393C] text-indigo-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {copiedField === 'alias' ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                    )}
                    {business.bank_cbu && (
                      <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                        <div>
                          <div className="text-xs text-slate-400">CBU</div>
                          <div className="font-mono text-slate-900 text-sm tracking-tight">{business.bank_cbu}</div>
                        </div>
                        <button onClick={() => handleCopy(business.bank_cbu, 'cbu')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ml-2 ${copiedField === 'cbu' ? 'bg-[#31393C] text-indigo-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {copiedField === 'cbu' ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                    )}
                    {business.bank_holder && (
                      <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                        <span className="text-slate-400 text-xs">Titular</span>
                        <span className="font-medium text-slate-800">{business.bank_holder}</span>
                      </div>
                    )}
                    {business.sena_amount > 0 && (
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-slate-500">Monto a transferir</span>
                        <span className="font-bold text-slate-900">{fmt(business.sena_amount)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 text-center mb-5">
                    Confirmamos tu turno por email a <strong>{selected.email}</strong> cuando recibamos la transferencia.<br/>
                    <span className="text-red-500 font-medium">Tenés 15 minutos — si no se recibe, el turno se cancela.</span>
                  </p>
                </div>
              ) : (
                /* ── MP o local: confirmado ── */
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon d={Icons.check} size={30} stroke="#10b981" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">¡Turno reservado!</h2>
                  <p className="text-slate-500 text-sm mb-5">
                    {selected.payMethod === 'mercadopago'
                      ? <>Seña pagada. Te enviamos los detalles a <strong>{selected.email}</strong></>
                      : <>El negocio te confirma el turno. Detalles enviados a <strong>{selected.email}</strong></>
                    }
                  </p>
                  {svc && (
                    <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm mb-5">
                      <div className="flex justify-between"><span className="text-slate-500">Negocio</span><span className="font-medium">{business.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium">{svc.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium">{new Date(selected.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-medium">{selected.time} hs</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-medium">{fmt(svc.price)}</span></div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => { setStep(1); setSelected({ service: null, date: today(), time: null, name: '', email: '', phone: '', payMethod: '' }) }}
                className="w-full py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors mb-2">
                Reservar otro turno
              </button>
              <button onClick={() => navigate('/')} className="text-sm text-slate-600 hover:underline flex justify-center">
                Volver al inicio
              </button>
            </div>
          )}

          {/* Navegación */}
          {step < 5 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button onClick={async () => {
                  if (step === 3) await releaseSlot()
                  setStep(s => s - 1)
                }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                  ← Volver
                </button>
              )}
              <button
                onClick={async () => {
                  if (step === 2) {
                    const { error } = await reserveSlot()
                    if (error) { alert('Este turno acaba de ser tomado. Elegí otro horario.'); return }
                    setStep(3)
                  } else if (step < 4) {
                    setStep(s => s + 1)
                  } else {
                    confirmBooking()
                  }
                }}
                disabled={!canNext() || submitting || mpLoading}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${canNext() && !submitting && !mpLoading ? 'bg-[#31393C] text-indigo-600 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {submitting || mpLoading ? (mpLoading ? 'Redirigiendo a MercadoPago...' : 'Confirmando...') : step === 4 ? (selected.payMethod === 'mercadopago' ? 'Confirmar y pagar seña →' : 'Confirmar reserva →') : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

