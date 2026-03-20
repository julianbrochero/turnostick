import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Icon, Icons } from '../components/Icon'
import StatusBadge from '../components/StatusBadge'

const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const fmt   = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const today = () => new Date().toISOString().split('T')[0]

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

const fmtDay = (d) => {
  const dt = new Date(d + 'T12:00')
  return {
    day:   dt.toLocaleDateString('es-AR', { weekday: 'short' }),
    num:   dt.getDate(),
    month: dt.toLocaleDateString('es-AR', { month: 'short' }),
  }
}

export default function Admin() {
  const { business, signOut, updateBusiness } = useAuth()
  const navigate = useNavigate()

  const [view, setView]               = useState('dashboard')
  const [bookings, setBookings]       = useState([])
  const [services, setServices]       = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [mobileMenu, setMobileMenu]   = useState(false)
  const [notification, setNotification] = useState(null)
  const [subPaying, setSubPaying]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // booking id to confirm delete
  const [filterDate, setFilterDate]   = useState(null)    // null = all dates
  const [canScrollDaysLeft, setCanScrollDaysLeft] = useState(false)
  const [canScrollDaysRight, setCanScrollDaysRight] = useState(false)
  const dayPickerRef = useRef(null)

  // Booking modal
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [newBooking, setNewBooking] = useState({ client_name: '', client_email: '', service_id: '', date: today(), time: '10:00' })
  const [filterStatus, setFilterStatus] = useState('all')

  // Service modal
  const [showNewService, setShowNewService] = useState(false)
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0, color: '#4A6C0E', emoji: '✂️' })

  // Settings
  const [settingsForm, setSettingsForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [payForm, setPayForm] = useState({ sena_amount: 0, mp_access_token: '', bank_cbu: '', bank_alias: '', bank_holder: '', bank_bank: '', notification_email: '' })

  // Horarios
  const DAYS = [
    { dow: 1, label: 'Lunes' }, { dow: 2, label: 'Martes' }, { dow: 3, label: 'Miércoles' },
    { dow: 4, label: 'Jueves' }, { dow: 5, label: 'Viernes' }, { dow: 6, label: 'Sábado' },
    { dow: 0, label: 'Domingo' },
  ]
  const DEFAULT_SCHEDULE = DAYS.map(d => ({
    day_of_week: d.dow, is_open: d.dow >= 1 && d.dow <= 6,
    open_time: '09:00', close_time: '18:00',
  }))
  const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
    const total = 480 + i * 30  // 08:00 a 21:30
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })
  const [schedule, setSchedule]       = useState(DEFAULT_SCHEDULE)
  const [overrides, setOverrides]     = useState([])
  const [newOverride, setNewOverride] = useState({ date: '', is_open: true, open_time: '09:00', close_time: '18:00' })
  const [blockedSlots, setBlockedSlots]       = useState([])
  const [recurringBlocked, setRecurringBlocked] = useState([])
  const [blockMode, setBlockMode]             = useState('date')   // 'date' | 'recurring'
  const [blockDate, setBlockDate]             = useState(today())
  const [blockDow, setBlockDow]               = useState(1)        // 1=Lunes por defecto
  const blockDays = [...Array(30)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (business) {
      fetchAll()
      setSettingsForm({ name: business.name || '', address: business.address || '', phone: business.phone || '', email: business.email || '' })
      setPayForm({
        sena_amount:        business.sena_amount        || 0,
        mp_access_token:    business.mp_access_token    || '',
        bank_cbu:           business.bank_cbu           || '',
        bank_alias:         business.bank_alias         || '',
        bank_holder:        business.bank_holder        || '',
        bank_bank:          business.bank_bank          || '',
        notification_email: business.notification_email || '',
      })
    }
  }, [business])

  const fetchAll = async () => {
    const [bRes, sRes, schRes, ovRes, blRes, rbRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('business_id', business.id).order('date', { ascending: true }),
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('schedules').select('*').eq('business_id', business.id),
      supabase.from('schedule_overrides').select('*').eq('business_id', business.id).gte('date', today()).order('date'),
      supabase.from('blocked_slots').select('*').eq('business_id', business.id).gte('date', today()).order('date').order('time'),
      supabase.from('recurring_blocked_slots').select('*').eq('business_id', business.id),
    ])
    setBookings(bRes.data || [])
    setServices(sRes.data || [])
    if (schRes.data?.length) {
      setSchedule(DEFAULT_SCHEDULE.map(def => schRes.data.find(s => s.day_of_week === def.day_of_week) || def))
    }
    setOverrides(ovRes.data || [])
    setBlockedSlots(blRes.data || [])
    setRecurringBlocked(rbRes.data || [])
    setLoadingData(false)
  }

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000) }

  const svcName = (id) => services.find(s => s.id === id)?.name || '-'

  // ── Booking CRUD ────────────────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    notify('Estado actualizado')
  }

  const markPaid = async (id) => {
    await supabase.from('bookings').update({ paid: true, status: 'confirmed' }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, paid: true, status: 'confirmed' } : b))
    notify('Pago registrado')
  }

  const deleteBooking = async (id) => {
    await supabase.from('bookings').delete().eq('id', id)
    setBookings(prev => prev.filter(b => b.id !== id))
    notify('Turno eliminado')
  }

  const addBooking = async () => {
    if (!newBooking.client_name || !newBooking.client_email || !newBooking.service_id) return
    const svc = services.find(s => s.id === newBooking.service_id)
    const { data, error } = await supabase.from('bookings').insert({
      business_id: business.id,
      service_id:  newBooking.service_id,
      client_name: newBooking.client_name,
      client_email: newBooking.client_email,
      date:   newBooking.date,
      time:   newBooking.time,
      status: 'confirmed',
      paid:   false,
      amount: svc?.price || 0,
    }).select().single()
    if (error) { notify('Error al crear turno'); return }
    setBookings(prev => [...prev, data])
    setShowNewBooking(false)
    setNewBooking({ client_name: '', client_email: '', service_id: '', date: today(), time: '10:00' })
    notify('Turno creado')
  }

  // ── Service CRUD ────────────────────────────────────────────────────────────
  const addService = async () => {
    if (!newService.name) return
    const { data, error } = await supabase.from('services').insert({ business_id: business.id, ...newService }).select().single()
    if (error) { notify('Error al crear servicio'); return }
    setServices(prev => [...prev, data])
    setShowNewService(false)
    setNewService({ name: '', duration: 30, price: 0, color: '#4A6C0E', emoji: '✂️' })
    notify('Servicio creado')
  }

  const deleteService = async (id) => {
    await supabase.from('services').update({ active: false }).eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
    notify('Servicio eliminado')
  }

  // ── Schedule ────────────────────────────────────────────────────────────────
  const saveSchedule = async () => {
    // delete + insert is more reliable than upsert when rows may lack id
    const { error: delErr } = await supabase.from('schedules').delete().eq('business_id', business.id)
    if (delErr) { notify('Error al guardar'); return }
    const rows = schedule.map(({ day_of_week, is_open, open_time, close_time }) => ({
      business_id: business.id, day_of_week, is_open, open_time, close_time,
    }))
    const { error } = await supabase.from('schedules').insert(rows)
    if (error) notify('Error al guardar')
    else notify('Horarios guardados ✓')
  }

  const updateDay = (dow, field, value) => {
    setSchedule(prev => prev.map(s => s.day_of_week === dow ? { ...s, [field]: value } : s))
  }

  const addOverride = async () => {
    if (!newOverride.date) return
    const row = { ...newOverride, business_id: business.id }
    const { data, error } = await supabase.from('schedule_overrides')
      .upsert(row, { onConflict: 'business_id,date' }).select().single()
    if (error) { notify('Error al guardar excepción'); return }
    setOverrides(prev => [...prev.filter(o => o.date !== data.date), data].sort((a, b) => a.date.localeCompare(b.date)))
    setNewOverride({ date: '', is_open: true, open_time: '09:00', close_time: '18:00' })
    notify('Excepción guardada')
  }

  const deleteOverride = async (id) => {
    await supabase.from('schedule_overrides').delete().eq('id', id)
    setOverrides(prev => prev.filter(o => o.id !== id))
    notify('Excepción eliminada')
  }

  // Slots disponibles para una fecha (sin filtrar bloqueados, para poder gestionarlos)
  const slotsForDate = (date) => {
    const override = overrides.find(o => o.date === date)
    if (override) {
      if (!override.is_open) return []
      return generateSlots(override.open_time, override.close_time)
    }
    const dow = new Date(date + 'T12:00').getDay()
    const sch = schedule.find(s => s.day_of_week === dow)
    if (!sch || !sch.is_open) return []
    return generateSlots(sch.open_time, sch.close_time)
  }

  // Slots para un día de la semana (sin filtrar)
  const slotsForDow = (dow) => {
    const sch = schedule.find(s => s.day_of_week === dow)
    if (!sch || !sch.is_open) return []
    return generateSlots(sch.open_time, sch.close_time)
  }

  const toggleBlockSlot = async (date, time) => {
    const existing = blockedSlots.find(b => b.date === date && b.time === time)
    if (existing) {
      const { error } = await supabase.from('blocked_slots').delete().eq('id', existing.id)
      if (error) { notify('Error al desbloquear: ' + error.message); return }
      setBlockedSlots(prev => prev.filter(b => b.id !== existing.id))
    } else {
      const { data, error } = await supabase.from('blocked_slots')
        .insert({ business_id: business.id, date, time }).select().single()
      if (error) { notify('Error al bloquear: ' + error.message); return }
      if (data) setBlockedSlots(prev => [...prev, data])
    }
  }

  const toggleRecurringBlock = async (dow, time) => {
    const existing = recurringBlocked.find(b => b.day_of_week === dow && b.time === time)
    if (existing) {
      const { error } = await supabase.from('recurring_blocked_slots').delete().eq('id', existing.id)
      if (error) { notify('Error al desbloquear: ' + error.message); return }
      setRecurringBlocked(prev => prev.filter(b => b.id !== existing.id))
    } else {
      const { data, error } = await supabase.from('recurring_blocked_slots')
        .insert({ business_id: business.id, day_of_week: dow, time }).select().single()
      if (error) { notify('Error al bloquear: ' + error.message); return }
      if (data) setRecurringBlocked(prev => [...prev, data])
    }
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    try { await updateBusiness(settingsForm); notify('Cambios guardados') }
    catch { notify('Error al guardar') }
  }

  const savePaySettings = async () => {
    try { await updateBusiness({ ...payForm, sena_amount: Number(payForm.sena_amount) }); notify('Configuración de pagos guardada') }
    catch { notify('Error al guardar') }
  }

  const confirmAndNotify = async (booking) => {
    await updateStatus(booking.id, 'confirmed')
    const svc = services.find(s => s.id === booking.service_id)
    try {
      const { data, error } = await supabase.functions.invoke('send-confirmation', {
        body: {
          to:               booking.client_email,
          client_name:      booking.client_name,
          service:          svc?.name || '-',
          date:             booking.date,
          time:             booking.time,
          amount:           booking.amount,
          business_name:    business.name,
          business_phone:   business.phone,
          business_address: business.address,
          payment_method:   booking.payment_method || 'venue',
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      notify('Turno confirmado y email enviado ✉️')
    } catch (err) {
      notify(`Confirmado, pero no se pudo enviar el email: ${err.message || 'Error desconocido'}`)
    }
  }

  const whatsappLink = (booking) => {
    if (!booking.client_phone) return null
    const svc  = services.find(s => s.id === booking.service_id)
    const date = new Date(booking.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    const msg  = encodeURIComponent(`Hola ${booking.client_name}! 👋 Te confirmamos tu turno en *${business.name}*:\n📋 *${svc?.name}*\n📅 ${date} a las ${booking.time} hs\n\n¡Te esperamos!`)
    const phone = booking.client_phone.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${msg}`
  }

  const handleLogout = async () => { await signOut(); navigate('/') }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',     icon: Icons.chart    },
    { id: 'bookings',  label: 'Turnos',         icon: Icons.calendar },
    { id: 'services',  label: 'Servicios',      icon: Icons.scissors },
    { id: 'horarios',  label: 'Horarios',       icon: Icons.clock    },
    { id: 'payments',  label: 'Pagos',          icon: Icons.dollar   },
    { id: 'settings',  label: 'Configuración',  icon: Icons.settings },
  ]

  const statusFiltered = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus)
  const filteredBookings = filterDate ? statusFiltered.filter(b => b.date === filterDate) : statusFiltered
  // Unique sorted dates from status-filtered bookings (for the day picker)
  const bookingDates = [...new Set(statusFiltered.map(b => b.date))].sort()
  const bookingDatesKey = bookingDates.join('|')

  const scrollDayPicker = (direction) => {
    const el = dayPickerRef.current
    if (!el) return
    const step = Math.max(el.clientWidth * 0.7, 180)
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' })
  }

  useEffect(() => {
    if (view !== 'bookings') return
    const el = dayPickerRef.current
    if (!el) return

    const updateScrollButtons = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      setCanScrollDaysLeft(el.scrollLeft > 2)
      setCanScrollDaysRight(el.scrollLeft < maxScroll - 2)
    }

    const rafId = requestAnimationFrame(updateScrollButtons)
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [view, bookingDatesKey, filterDate])

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    revenue:   bookings.filter(b => b.paid).reduce((s, b) => s + b.amount, 0),
  }

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C1C1E]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const bookingLink = `${window.location.origin}/b/${business?.slug}`

  // ── Subscription status ─────────────────────────────────────────────────────
  const getSubStatus = () => {
    if (!business) return { status: 'trial', daysLeft: 7 }
    const now  = new Date()
    const raw  = business.subscription_status || 'trial'

    const diffDays = (date) => Math.ceil((new Date(date) - now) / 86400000)

    if (raw === 'active') {
      const left = diffDays(business.subscription_expires_at)
      if (left > 1)  return { status: 'active', daysLeft: left }
      if (left >= 0) return { status: 'grace',  daysLeft: left }
      return { status: 'blocked' }
    }
    if (raw === 'blocked') return { status: 'blocked' }
    // trial (default)
    const trialEnd = business.trial_ends_at
      ? new Date(business.trial_ends_at)
      : new Date(Date.now() + 7 * 86400000)
    const left = diffDays(trialEnd)
    if (left > 1)  return { status: 'trial', daysLeft: left }
    if (left >= 0) return { status: 'grace',  daysLeft: left }
    return { status: 'blocked' }
  }

  const paySubscription = async () => {
    setSubPaying(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-subs-payment', {
        body: { business_id: business.id },
      })
      if (error) throw new Error(error.message || JSON.stringify(error))
      if (data?.error) throw new Error(data.error)
      if (!data?.init_point) throw new Error('No se recibió link de pago')
      window.location.href = data.init_point
    } catch (err) {
      console.error('paySubscription error:', err)
      notify('Error: ' + (err.message || 'No se pudo iniciar el pago'))
    } finally {
      setSubPaying(false)
    }
  }

  const sub = getSubStatus()

  // ── Pantalla bloqueada ────────────────────────────────────────────────────
  if (sub.status === 'blocked') return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Cuenta suspendida</h1>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">
        Tu período de prueba o suscripción venció. Activá tu plan para seguir usando turnoStick.
      </p>
      <div className="bg-[#242424] rounded-2xl border border-slate-800 shadow-sm p-6 w-full max-w-sm mb-4">
        <div className="text-2xl font-bold text-white mb-0.5">$14.999 <span className="text-sm font-normal text-slate-400">ARS/mes</span></div>
        <p className="text-xs text-slate-500 mb-4">Reservas ilimitadas · Pagos · Horarios · Notificaciones</p>
        <button onClick={paySubscription} disabled={subPaying}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
          {subPaying ? 'Redirigiendo...' : '💳 Activar con MercadoPago'}
        </button>
      </div>
      <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-400">Cerrar sesión</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col">
      {/* TOP BAR */}
      <header className="bg-[#242424] border-b border-slate-800 h-14 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 z-40">
        <button className="md:hidden" onClick={() => setMobileMenu(m => !m)}>
          <Icon d={Icons.menu} size={20} stroke="#9ca3af" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="turnoStick" className="w-7 h-7" />
          <span className="font-bold text-white text-sm">turnoStick</span>
          <span className="text-xs bg-indigo-50 text-white px-2 py-0.5 rounded-full font-bold">Admin</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => { navigator.clipboard.writeText(bookingLink); notify('Link copiado') }}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors font-medium border border-slate-700">
            <Icon d={Icons.copy} size={13} stroke="#AAFF00" /> Copiar link de reservas
          </button>
          <button onClick={() => navigate(`/b/${business?.slug}`)}
            className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors font-medium border border-slate-700">
            <Icon d={Icons.eye} size={13} stroke="#9ca3af" /> Ver página
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {business?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#242424] border-r border-slate-800 pt-14 transform transition-transform md:static md:translate-x-0 md:z-auto ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-3 space-y-1">
            {navItems.map(({ id, label, icon }) => (
              <button key={id} onClick={() => { setView(id); setMobileMenu(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icon d={icon} size={17} stroke={view === id ? '#1C1C1E' : 'currentColor'} />
                {label}
              </button>
            ))}
            <div className="pt-3 border-t border-slate-800 mt-3 space-y-1">
              <button onClick={() => navigate('/')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all">
                <Icon d={Icons.home} size={17} /> Ir al sitio
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950 transition-all">
                <Icon d={Icons.logout} size={17} /> Cerrar sesión
              </button>
            </div>
          </nav>
        </aside>
        {mobileMenu && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenu(false)} />}

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {notification && (
            <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
              <Icon d={Icons.check} size={14} stroke="#1C1C1E" /> {notification}
            </div>
          )}

          {/* ── Banner de suscripción ── */}
          {sub.status === 'trial' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <img src="/logo.png" alt="turnoStick" className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-800">
                    Prueba gratis — {sub.daysLeft} día{sub.daysLeft !== 1 ? 's' : ''} restante{sub.daysLeft !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">Después $14.999 ARS/mes para continuar</p>
                </div>
              </div>
              <button onClick={paySubscription} disabled={subPaying}
                className="shrink-0 bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {subPaying ? '...' : 'Activar ya'}
              </button>
            </div>
          )}
          {sub.status === 'grace' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  ⚠️ Último día — tu cuenta se bloquea mañana
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Activá tu suscripción ahora para no perder el acceso</p>
              </div>
              <button onClick={paySubscription} disabled={subPaying}
                className="shrink-0 bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60">
                {subPaying ? '...' : 'Pagar ahora'}
              </button>
            </div>
          )}
          {sub.status === 'active' && sub.daysLeft <= 5 && (
            <div className="bg-[#1C1C1E] border border-slate-700 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                📅 Tu suscripción vence en <strong>{sub.daysLeft} días</strong>
              </p>
              <button onClick={paySubscription} disabled={subPaying}
                className="shrink-0 text-xs text-indigo-600 font-semibold hover:underline disabled:opacity-60">
                {subPaying ? '...' : 'Renovar'}
              </button>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-slate-500">{business?.name}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total turnos',      val: stats.total,          icon: Icons.calendar, color: 'indigo'  },
                  { label: 'Confirmados',        val: stats.confirmed,      icon: Icons.check,    color: 'emerald' },
                  { label: 'Pendientes',         val: stats.pending,        icon: Icons.clock,    color: 'amber'   },
                  { label: 'Ingresos cobrados',  val: fmt(stats.revenue),   icon: Icons.dollar,   color: 'violet'  },
                ].map(({ label, val, icon }) => (
                  <div key={label} className="bg-[#242424] rounded-2xl border border-slate-800 p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-indigo-50">
                      <Icon d={icon} size={16} stroke="#AAFF00" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5">{val}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Link rápido */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-indigo-900">Tu página de reservas está activa</div>
                  <div className="text-xs text-indigo-600 mt-0.5">{bookingLink}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(bookingLink); notify('Link copiado') }}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  <Icon d={Icons.copy} size={13} stroke="#1C1C1E" /> Copiar
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-4 text-sm">Próximos turnos</h3>
                  {bookings.filter(b => b.status !== 'cancelled').length === 0
                    ? <p className="text-sm text-slate-400">No hay turnos aún</p>
                    : <div className="space-y-3">
                        {bookings.filter(b => b.status !== 'cancelled').slice(0, 4).map(b => (
                          <div key={b.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {b.client_name?.[0]}
                              </div>
                              <div>
                                <div className="font-medium text-white text-xs">{b.client_name}</div>
                                <div className="text-xs text-slate-400">{svcName(b.service_id)} · {b.time}</div>
                              </div>
                            </div>
                            <StatusBadge status={b.status} />
                          </div>
                        ))}
                      </div>
                  }
                </div>
                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-4 text-sm">Servicios más reservados</h3>
                  {services.length === 0
                    ? <p className="text-sm text-slate-400">Aún no creaste servicios</p>
                    : <div className="space-y-3">
                        {services.map(s => {
                          const count = bookings.filter(b => b.service_id === s.id).length
                          const pct   = bookings.length ? Math.round((count / bookings.length) * 100) : 0
                          return (
                            <div key={s.id}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300 font-medium">{s.name}</span>
                                <span className="text-slate-500">{count} turnos</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: s.color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {view === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Turnos</h1>
                <button onClick={() => setShowNewBooking(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                  <Icon d={Icons.plus} size={16} stroke="#1C1C1E" /> Nuevo turno
                </button>
              </div>
              {/* Status filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5">
                {[['all','Todos'],['confirmed','Confirmados'],['pending','Pendientes'],['cancelled','Cancelados']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterStatus(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterStatus === val ? 'bg-indigo-600 text-slate-900' : 'bg-[#242424] border border-slate-700 text-slate-400 hover:border-indigo-300'}`}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Day picker */}
              {bookingDates.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">Filtrar por día</p>
                    {filterDate && (
                      <button onClick={() => setFilterDate(null)}
                        className="text-xs text-indigo-600 font-semibold hover:underline">
                        Ver todos
                      </button>
                    )}
                  </div>

                  <div ref={dayPickerRef} className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
                    <button onClick={() => setFilterDate(null)}
                      className={`flex flex-col items-center justify-center min-w-[62px] px-2 py-2 rounded-xl border transition-all flex-shrink-0 ${filterDate === null ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-700 bg-[#242424] hover:border-slate-600'}`}>
                      <span className={`text-xs ${filterDate === null ? 'text-indigo-500' : 'text-slate-500'}`}>Todos</span>
                      <span className={`text-lg font-bold leading-tight ${filterDate === null ? 'text-indigo-700' : 'text-slate-200'}`}>·</span>
                      <span className={`text-xs ${filterDate === null ? 'text-indigo-400' : 'text-slate-400'}`}>Días</span>
                    </button>

                    {bookingDates.map(d => {
                      const dt    = new Date(d + 'T12:00')
                      const day   = dt.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
                      const num   = dt.getDate()
                      const month = dt.toLocaleDateString('es-AR', { month: 'short' })
                      const isSelected = filterDate === d
                      const isToday    = d === today()
                      return (
                        <button key={d} onClick={() => setFilterDate(d)}
                          className={`flex flex-col items-center justify-center min-w-[62px] px-2 py-2 rounded-xl border transition-all flex-shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-700 bg-[#242424] hover:border-slate-600'}`}>
                          <span className={`text-xs capitalize ${isSelected ? 'text-indigo-500' : 'text-slate-500'}`}>{isToday ? 'Hoy' : day}</span>
                          <span className={`text-lg font-bold leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-200'}`}>{num}</span>
                          <span className={`text-xs capitalize ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>{month}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <button type="button" onClick={() => scrollDayPicker('left')} disabled={!canScrollDaysLeft}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <span className="inline-flex rotate-180"><Icon d={Icons.arrow} size={12} /></span>
                    </button>
                    <p className="text-[11px] text-slate-400">Deslizá para ver más días</p>
                    <button type="button" onClick={() => scrollDayPicker('right')} disabled={!canScrollDaysRight}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <Icon d={Icons.arrow} size={12} />
                    </button>
                  </div>
                </div>
              )}
              {filteredBookings.length === 0
                ? <div className="bg-[#242424] rounded-2xl border border-slate-800 p-12 text-center text-slate-400 text-sm">No hay turnos para mostrar</div>
                : (() => {
                    const todayStr = today()
                    // Group by date, sorted chronologically
                    const groups = filteredBookings.reduce((acc, b) => {
                      if (!acc[b.date]) acc[b.date] = []
                      acc[b.date].push(b)
                      return acc
                    }, {})
                    const sortedDates = Object.keys(groups).sort()
                    return (
                      <div className="space-y-6">
                        {sortedDates.map(date => {
                          const isToday = date === todayStr
                          const isPast  = date < todayStr
                          const dateLabel = new Date(date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                          const dayBookings = groups[date].slice().sort((a, b) => a.time.localeCompare(b.time))
                          return (
                            <div key={date}>
                              {/* Day header */}
                              <div className={`flex items-center gap-2 mb-3 ${isPast ? 'opacity-60' : ''}`}>
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isToday ? 'bg-indigo-500' : isPast ? 'bg-slate-300' : 'bg-emerald-400'}`} />
                                <span className={`text-sm font-bold capitalize ${isToday ? 'text-indigo-700' : 'text-slate-300'}`}>
                                  {isToday ? 'Hoy — ' : ''}{dateLabel}
                                </span>
                                <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
                                  {dayBookings.length} turno{dayBookings.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {/* Cards for this day */}
                              <div className="space-y-2.5">
                                {dayBookings.map(b => (
                                  <div key={b.id} className={`bg-[#242424] rounded-2xl border shadow-sm overflow-hidden transition-all ${b.status === 'cancelled' ? 'border-red-100 opacity-60' : isToday ? 'border-indigo-100' : 'border-slate-800'}`}>
                                    {/* Top row: time pill + avatar + name + status */}
                                    <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-800 text-slate-400'}`}>
                                          {b.time}
                                        </div>
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                          {b.client_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-semibold text-white text-sm truncate">{b.client_name}</div>
                                          <div className="text-xs text-slate-400 truncate">{b.client_email}</div>
                                        </div>
                                      </div>
                                      <StatusBadge status={b.status} />
                                    </div>

                                    {/* Service + amount row */}
                                    <div className="flex items-center justify-between px-4 py-2 bg-[#1C1C1E] mx-3 rounded-xl mb-3">
                                      <div className="text-xs font-medium text-slate-300">{svcName(b.service_id)}</div>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-white">{fmt(b.amount)}</div>
                                        {b.paid
                                          ? <span className="text-xs text-emerald-600 font-medium">✓ Pagado</span>
                                          : b.status !== 'cancelled' && (
                                              <button onClick={() => markPaid(b.id)} className="text-xs text-amber-600 font-medium hover:underline">Marcar pagado</button>
                                            )
                                        }
                                      </div>
                                    </div>

                                    {/* Actions row */}
                                    <div className="flex items-center gap-2 px-4 pb-3">
                                      {b.status !== 'confirmed' && b.status !== 'cancelled' && (
                                        <button onClick={() => confirmAndNotify(b)}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors">
                                          <Icon d={Icons.check} size={13} stroke="#047857" /> Confirmar
                                        </button>
                                      )}
                                      {b.status !== 'cancelled' && (
                                        <button onClick={() => updateStatus(b.id, 'cancelled')}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                                          <Icon d={Icons.x} size={13} stroke="#dc2626" /> Anular
                                        </button>
                                      )}
                                      {whatsappLink(b) && (
                                        <a href={whatsappLink(b)} target="_blank" rel="noreferrer"
                                          className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex-shrink-0">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        </a>
                                      )}
                                      {confirmDelete === b.id
                                        ? <div className="flex items-center gap-1.5 ml-auto">
                                            <span className="text-xs text-slate-500">¿Eliminar?</span>
                                            <button onClick={() => { deleteBooking(b.id); setConfirmDelete(null) }}
                                              className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
                                              Sí
                                            </button>
                                            <button onClick={() => setConfirmDelete(null)}
                                              className="px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors">
                                              No
                                            </button>
                                          </div>
                                        : <button onClick={() => setConfirmDelete(b.id)}
                                            className="w-9 h-9 flex items-center justify-center bg-[#1C1C1E] text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
                                            <Icon d={Icons.trash} size={14} />
                                          </button>
                                      }
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
              }

              {/* Modal nuevo turno */}
              {showNewBooking && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div className="bg-[#242424] rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-white">Nuevo turno</h3>
                      <button onClick={() => setShowNewBooking(false)}><Icon d={Icons.x} size={18} stroke="#94a3b8" /></button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Nombre del cliente', key: 'client_name', type: 'text' },
                        { label: 'Email',              key: 'client_email', type: 'email' },
                        { label: 'Fecha',              key: 'date',        type: 'date' },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
                          <input type={type} value={newBooking[key]}
                            onChange={e => setNewBooking(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Servicio</label>
                        <select value={newBooking.service_id} onChange={e => setNewBooking(p => ({ ...p, service_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                          <option value="">Seleccionar...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Hora</label>
                        <select value={newBooking.time} onChange={e => setNewBooking(p => ({ ...p, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowNewBooking(false)} className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium hover:bg-[#1C1C1E]">Cancelar</button>
                      <button onClick={addBooking} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Crear turno</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SERVICES ── */}
          {view === 'services' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Servicios</h1>
                <button onClick={() => setShowNewService(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                  <Icon d={Icons.plus} size={16} stroke="#1C1C1E" /> Nuevo servicio
                </button>
              </div>
              {services.length === 0
                ? <div className="bg-[#242424] rounded-2xl border border-slate-800 p-12 text-center">
                    <p className="text-slate-400 text-sm mb-4">Aún no creaste servicios</p>
                    <button onClick={() => setShowNewService(true)} className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700">
                      + Crear primer servicio
                    </button>
                  </div>
                : <div className="grid sm:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: s.color + '20' }}>
                            {s.emoji || '✂️'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{s.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1"><Icon d={Icons.clock} size={12} stroke="#94a3b8" /> {s.duration} min</span>
                              <span className="font-medium text-slate-300">{fmt(s.price)}</span>
                            </div>
                            <div className="text-xs mt-1 text-slate-400">{bookings.filter(b => b.service_id === s.id).length} reservas</div>
                          </div>
                        </div>
                        <button onClick={() => deleteService(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                          <Icon d={Icons.trash} size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
              }

              {/* Modal nuevo servicio */}
              {showNewService && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div className="bg-[#242424] rounded-2xl p-6 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-white">Nuevo servicio</h3>
                      <button onClick={() => setShowNewService(false)}><Icon d={Icons.x} size={18} stroke="#94a3b8" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                        <input type="text" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Duración (min)</label>
                          <input type="number" value={newService.duration} onChange={e => setNewService(p => ({ ...p, duration: +e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Precio (ARS)</label>
                          <input type="number" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: +e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Ícono</label>
                        <div className="flex gap-2 flex-wrap">
                          {['✂️','💇','💅','🧴','🪒','💆','🧖','👗','👠','💄','🏋️','🧘','💪','🩺','🦷','🐾','🎨','🍕','☕','🎵'].map(e => (
                            <button key={e} onClick={() => setNewService(p => ({ ...p, emoji: e }))}
                              className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${newService.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-[#1C1C1E] hover:bg-slate-800'}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {['#4A6C0E','#ec4899','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16'].map(c => (
                            <button key={c} onClick={() => setNewService(p => ({ ...p, color: c }))}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${newService.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowNewService(false)} className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium hover:bg-[#1C1C1E]">Cancelar</button>
                      <button onClick={addService} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Crear servicio</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {view === 'payments' && (
            <div>
              <h1 className="text-xl font-bold text-white mb-6">Pagos</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Ingresos cobrados',   val: fmt(bookings.filter(b => b.paid).reduce((s, b) => s + b.amount, 0)),                            color: 'text-emerald-600' },
                  { label: 'Pendiente de cobro',  val: fmt(bookings.filter(b => !b.paid && b.status !== 'cancelled').reduce((s, b) => s + b.amount, 0)), color: 'text-amber-600'   },
                  { label: 'Cancelados',           val: fmt(bookings.filter(b => b.status === 'cancelled').reduce((s, b) => s + b.amount, 0)),           color: 'text-red-500'     },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#242424] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800">
                  <h3 className="font-semibold text-white text-sm">Historial de pagos</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {bookings.length === 0
                    ? <div className="text-center py-12 text-slate-400 text-sm">No hay pagos aún</div>
                    : bookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${b.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-slate-500'}`}>
                            {b.client_name?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{b.client_name}</div>
                            <div className="text-xs text-slate-400">{svcName(b.service_id)} · {new Date(b.date + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white text-sm">{fmt(b.amount)}</span>
                          {b.paid
                            ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">Pagado</span>
                            : b.status === 'cancelled'
                              ? <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">Cancelado</span>
                              : <button onClick={() => markPaid(b.id)} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium hover:bg-amber-100 transition-colors">Marcar pagado</button>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── HORARIOS ── */}
          {view === 'horarios' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-white">Horarios</h1>
                <p className="text-sm text-slate-500">Configurá cuándo abrís cada día</p>
              </div>

              {/* ── Horario semanal ── */}
              <div className="bg-[#242424] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Horario semanal</h3>
                  <button onClick={saveSchedule}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <Icon d={Icons.check} size={13} stroke="#1C1C1E" /> Guardar
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {DAYS.map(({ dow, label }) => {
                    const day = schedule.find(s => s.day_of_week === dow) || DEFAULT_SCHEDULE.find(s => s.day_of_week === dow)
                    return (
                      <div key={dow} className="px-4 py-3">
                        {/* Fila 1: toggle + nombre */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateDay(dow, 'is_open', !day.is_open)}
                            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${day.is_open ? 'bg-indigo-600' : 'bg-slate-700'}`}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-[#242424] rounded-full shadow transition-transform ${day.is_open ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                          <span className={`text-sm font-semibold flex-1 ${day.is_open ? 'text-white' : 'text-slate-400'}`}>
                            {label}
                          </span>
                          {!day.is_open && <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Cerrado</span>}
                        </div>
                        {/* Fila 2: selectores de hora (solo si está abierto) */}
                        {day.is_open && (
                          <div className="flex items-center gap-2 mt-2.5 pl-14">
                            <select
                              value={day.open_time}
                              onChange={e => updateDay(dow, 'open_time', e.target.value)}
                              className="flex-1 min-w-0 px-2 py-2 border border-slate-700 rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-slate-400 text-xs shrink-0">→</span>
                            <select
                              value={day.close_time}
                              onChange={e => updateDay(dow, 'close_time', e.target.value)}
                              className="flex-1 min-w-0 px-2 py-2 border border-slate-700 rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Bloquear horarios ── */}
              <div className="bg-[#242424] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h3 className="font-semibold text-white text-sm">Bloquear horarios</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tocá los turnos que querés inhabilitar — toca de nuevo para desbloquear</p>
                </div>

                {/* Modo: fecha puntual vs siempre ese día */}
                <div className="px-4 pt-4 flex gap-2">
                  <button onClick={() => setBlockMode('date')}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${blockMode === 'date' ? 'bg-indigo-600 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    📅 Fecha específica
                  </button>
                  <button onClick={() => setBlockMode('recurring')}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${blockMode === 'recurring' ? 'bg-indigo-600 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    🔁 Siempre ese día
                  </button>
                </div>

                {/* ── Modo: fecha específica ── */}
                {blockMode === 'date' && (() => {
                  const slots = slotsForDate(blockDate)
                  return (
                    <div className="px-4 py-4 space-y-4">
                      {/* Scroll de días */}
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {blockDays.map(d => {
                          const { day, num, month } = fmtDay(d)
                          const hasBlocks = blockedSlots.some(b => b.date === d)
                          return (
                            <button key={d} onClick={() => setBlockDate(d)}
                              className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all shrink-0 ${blockDate === d ? 'border-red-500 bg-red-50' : 'border-slate-800 hover:border-slate-700'}`}>
                              <span className="text-xs text-slate-500 capitalize">{day}</span>
                              <span className={`text-lg font-bold ${blockDate === d ? 'text-red-600' : 'text-white'}`}>{num}</span>
                              <span className="text-xs text-slate-400 capitalize">{month}</span>
                              {hasBlocks && <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-0.5" />}
                            </button>
                          )
                        })}
                      </div>

                      {slots.length === 0
                        ? <p className="text-center text-slate-400 text-sm py-4">Este día está cerrado</p>
                        : <>
                            <p className="text-xs text-slate-500">Tocá un turno para bloquearlo (rojo) o desbloquearlo</p>
                            <div className="grid grid-cols-4 gap-2">
                              {slots.map(t => {
                                const isBlocked = blockedSlots.some(b => b.date === blockDate && b.time === t)
                                return (
                                  <button key={t} onClick={() => toggleBlockSlot(blockDate, t)}
                                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${isBlocked ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'border-slate-700 text-slate-300 hover:border-red-300 hover:bg-red-50'}`}>
                                    {t}
                                    {isBlocked && <div className="text-xs opacity-80">🚫</div>}
                                  </button>
                                )
                              })}
                            </div>
                          </>
                      }
                    </div>
                  )
                })()}

                {/* ── Modo: siempre ese día de la semana ── */}
                {blockMode === 'recurring' && (() => {
                  const slots = slotsForDow(blockDow)
                  const dowLabel = DAYS.find(d => d.dow === blockDow)?.label || ''
                  return (
                    <div className="px-4 py-4 space-y-4">
                      {/* Selector día de la semana */}
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {DAYS.map(({ dow, label }) => {
                          const hasBlocks = recurringBlocked.some(b => b.day_of_week === dow)
                          return (
                            <button key={dow} onClick={() => setBlockDow(dow)}
                              className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all shrink-0 ${blockDow === dow ? 'border-red-500 bg-red-50' : 'border-slate-800 hover:border-slate-700'}`}>
                              <span className={`text-xs font-semibold ${blockDow === dow ? 'text-red-600' : 'text-slate-300'}`}>{label.slice(0,3)}</span>
                              {hasBlocks && <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1" />}
                            </button>
                          )
                        })}
                      </div>

                      {slots.length === 0
                        ? <p className="text-center text-slate-400 text-sm py-4">{dowLabel} está cerrado en el horario semanal</p>
                        : <>
                            <p className="text-xs text-slate-500">Estos turnos quedarán bloqueados <strong>todos los {dowLabel}</strong></p>
                            <div className="grid grid-cols-4 gap-2">
                              {slots.map(t => {
                                const isBlocked = recurringBlocked.some(b => b.day_of_week === blockDow && b.time === t)
                                return (
                                  <button key={t} onClick={() => toggleRecurringBlock(blockDow, t)}
                                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${isBlocked ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'border-slate-700 text-slate-300 hover:border-red-300 hover:bg-red-50'}`}>
                                    {t}
                                    {isBlocked && <div className="text-xs opacity-80">🚫</div>}
                                  </button>
                                )
                              })}
                            </div>
                          </>
                      }
                    </div>
                  )
                })()}

                {/* Leyenda */}
                <div className="px-4 pb-4 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-3">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Bloqueado</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-slate-700 inline-block" />Disponible</span>
                </div>
              </div>

              {/* ── Excepciones por día ── */}
              <div className="bg-[#242424] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h3 className="font-semibold text-white text-sm">Cerrar o cambiar horario de un día</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Feriados, días especiales o con horario distinto</p>
                </div>
                <div className="px-4 py-4 bg-[#1C1C1E] border-b border-slate-800 space-y-3">
                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                    <input type="date" value={newOverride.date} min={today()}
                      onChange={e => setNewOverride(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  {/* Toggle abierto/cerrado */}
                  <div className="flex items-center justify-between bg-[#242424] border border-slate-700 rounded-lg px-3 py-2.5">
                    <span className="text-sm font-medium text-slate-300">
                      {newOverride.is_open ? '🟢 Abierto con horario especial' : '🔴 Cerrado todo el día'}
                    </span>
                    <button onClick={() => setNewOverride(p => ({ ...p, is_open: !p.is_open }))}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${newOverride.is_open ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-[#242424] rounded-full shadow transition-transform ${newOverride.is_open ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {/* Horarios (solo si abierto) */}
                  {newOverride.is_open && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Desde</label>
                        <select value={newOverride.open_time} onChange={e => setNewOverride(p => ({ ...p, open_time: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-indigo-300">
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Hasta</label>
                        <select value={newOverride.close_time} onChange={e => setNewOverride(p => ({ ...p, close_time: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#242424] focus:outline-none focus:ring-2 focus:ring-indigo-300">
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <button onClick={addOverride}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    + Agregar
                  </button>
                </div>
                {overrides.length === 0
                  ? <div className="text-center py-6 text-slate-400 text-sm">No hay excepciones configuradas</div>
                  : <div className="divide-y divide-slate-50">
                      {overrides.map(o => (
                        <div key={o.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${o.is_open ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {new Date(o.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </div>
                              <div className="text-xs text-slate-500">
                                {o.is_open ? `${o.open_time} → ${o.close_time}` : 'Cerrado todo el día'}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => deleteOverride(o.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                            <Icon d={Icons.trash} size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <div>
              <h1 className="text-xl font-bold text-white mb-6">Configuración</h1>
              <div className="grid gap-4 max-w-2xl">
                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-4 text-sm">Información del negocio</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Nombre del negocio', key: 'name',    placeholder: 'Mi Peluquería' },
                      { label: 'Email de contacto',  key: 'email',   placeholder: 'negocio@email.com' },
                      { label: 'Teléfono',           key: 'phone',   placeholder: '+54 11 1234-5678' },
                      { label: 'Dirección',          key: 'address', placeholder: 'Av. Corrientes 1234' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                        <input type="text" value={settingsForm[key]} placeholder={placeholder}
                          onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                    ))}
                  </div>
                  <button onClick={saveSettings} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                    Guardar cambios
                  </button>
                </div>

                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-4 text-sm">Enlace público de reservas</h3>
                  <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-lg px-3 py-2.5">
                    <Icon d={Icons.link} size={14} stroke="#94a3b8" />
                    <span className="text-sm text-slate-400 flex-1 break-all">{bookingLink}</span>
                    <button onClick={() => { navigator.clipboard.writeText(bookingLink); notify('Copiado') }}
                      className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap">Copiar</button>
                  </div>
                  <button onClick={() => navigate(`/b/${business?.slug}`)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                    <Icon d={Icons.eye} size={13} /> Ver página de reservas
                  </button>
                </div>

                {/* Configuración de pagos */}
                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-1 text-sm">Cobros y pagos</h3>
                  <p className="text-xs text-slate-400 mb-4">Configurá cómo cobrar la seña de tus turnos</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Monto de la seña (ARS)</label>
                      <input type="number" value={payForm.sena_amount} placeholder="Ej: 900"
                        onChange={e => setPayForm(p => ({ ...p, sena_amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      <p className="text-xs text-slate-400 mt-0.5">Ponés 0 para no cobrar seña</p>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">MercadoPago</p>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Access Token de producción</label>
                      <input type="password" value={payForm.mp_access_token} placeholder="APP_USR-..."
                        onChange={e => setPayForm(p => ({ ...p, mp_access_token: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      <p className="text-xs text-slate-400 mt-0.5">mercadopago.com/developers → Mis aplicaciones → Access Token</p>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Transferencia bancaria</p>
                      {[
                        { label: 'CBU / CVU', key: 'bank_cbu',    placeholder: '0000003100012345678901' },
                        { label: 'Alias',     key: 'bank_alias',  placeholder: 'mi.alias.mp' },
                        { label: 'Titular',   key: 'bank_holder', placeholder: 'María García' },
                        { label: 'Banco',     key: 'bank_bank',   placeholder: 'Mercado Pago / Banco Nación...' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className="mb-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                          <input type="text" value={payForm[key]} placeholder={placeholder}
                            onChange={e => setPayForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Notificaciones</p>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Email para alertas de nuevos turnos</label>
                      <input type="email" value={payForm.notification_email} placeholder="vos@email.com"
                        onChange={e => setPayForm(p => ({ ...p, notification_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-[#2A2A2A] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                    </div>
                  </div>
                  <button onClick={savePaySettings} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                    Guardar configuración de pagos
                  </button>
                </div>

                <div className="bg-[#242424] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-white mb-2 text-sm">Plan actual</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white capitalize">{business?.plan || 'free'}</span>
                      {business?.plan === 'free' && <p className="text-xs text-slate-400 mt-0.5">30 reservas / mes</p>}
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">Activo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
