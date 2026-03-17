import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Icon, Icons } from '../components/Icon'
import StatusBadge from '../components/StatusBadge'

const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const fmt   = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const today = () => new Date().toISOString().split('T')[0]

export default function Admin() {
  const { business, signOut, updateBusiness } = useAuth()
  const navigate = useNavigate()

  const [view, setView]               = useState('dashboard')
  const [bookings, setBookings]       = useState([])
  const [services, setServices]       = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [mobileMenu, setMobileMenu]   = useState(false)
  const [notification, setNotification] = useState(null)

  // Booking modal
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [newBooking, setNewBooking] = useState({ client_name: '', client_email: '', service_id: '', date: today(), time: '10:00' })
  const [filterStatus, setFilterStatus] = useState('all')

  // Service modal
  const [showNewService, setShowNewService] = useState(false)
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0, color: '#6366f1' })

  // Settings
  const [settingsForm, setSettingsForm] = useState({ name: '', address: '', phone: '', email: '' })

  useEffect(() => {
    if (business) {
      fetchAll()
      setSettingsForm({ name: business.name || '', address: business.address || '', phone: business.phone || '', email: business.email || '' })
    }
  }, [business])

  const fetchAll = async () => {
    const [bRes, sRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('business_id', business.id).order('date', { ascending: true }),
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('name'),
    ])
    setBookings(bRes.data || [])
    setServices(sRes.data || [])
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
    setNewService({ name: '', duration: 30, price: 0, color: '#6366f1' })
    notify('Servicio creado')
  }

  const deleteService = async (id) => {
    await supabase.from('services').update({ active: false }).eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
    notify('Servicio eliminado')
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    try {
      await updateBusiness(settingsForm)
      notify('Cambios guardados')
    } catch { notify('Error al guardar') }
  }

  const handleLogout = async () => { await signOut(); navigate('/') }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      icon: Icons.chart    },
    { id: 'bookings',  label: 'Turnos',          icon: Icons.calendar },
    { id: 'services',  label: 'Servicios',        icon: Icons.scissors },
    { id: 'payments',  label: 'Pagos',            icon: Icons.dollar   },
    { id: 'settings',  label: 'Configuración',   icon: Icons.settings },
  ]

  const filteredBookings = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus)

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    revenue:   bookings.filter(b => b.paid).reduce((s, b) => s + b.amount, 0),
  }

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const bookingLink = `${window.location.origin}/b/${business?.slug}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-100 h-14 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 z-40">
        <button className="md:hidden" onClick={() => setMobileMenu(m => !m)}>
          <Icon d={Icons.menu} size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Icon d={Icons.scissors} size={14} stroke="white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">turnoStick</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => { navigator.clipboard.writeText(bookingLink); notify('Link copiado') }}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
            <Icon d={Icons.copy} size={13} /> Copiar link de reservas
          </button>
          <button onClick={() => navigate(`/b/${business?.slug}`)}
            className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors font-medium">
            <Icon d={Icons.eye} size={13} /> Ver página
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {business?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-100 pt-14 transform transition-transform md:static md:translate-x-0 md:z-auto ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-3 space-y-1">
            {navItems.map(({ id, label, icon }) => (
              <button key={id} onClick={() => { setView(id); setMobileMenu(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon d={icon} size={17} stroke={view === id ? '#6366f1' : 'currentColor'} />
                {label}
              </button>
            ))}
            <div className="pt-3 border-t border-slate-100 mt-3 space-y-1">
              <button onClick={() => navigate('/')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-all">
                <Icon d={Icons.home} size={17} /> Ir al sitio
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all">
                <Icon d={Icons.logout} size={17} /> Cerrar sesión
              </button>
            </div>
          </nav>
        </aside>
        {mobileMenu && <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setMobileMenu(false)} />}

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {notification && (
            <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
              <Icon d={Icons.check} size={14} stroke="white" /> {notification}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500">{business?.name}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total turnos',      val: stats.total,          icon: Icons.calendar, color: 'indigo'  },
                  { label: 'Confirmados',        val: stats.confirmed,      icon: Icons.check,    color: 'emerald' },
                  { label: 'Pendientes',         val: stats.pending,        icon: Icons.clock,    color: 'amber'   },
                  { label: 'Ingresos cobrados',  val: fmt(stats.revenue),   icon: Icons.dollar,   color: 'violet'  },
                ].map(({ label, val, icon }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-indigo-50">
                      <Icon d={icon} size={16} stroke="#6366f1" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-0.5">{val}</div>
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
                  <Icon d={Icons.copy} size={13} stroke="white" /> Copiar
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm">Próximos turnos</h3>
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
                                <div className="font-medium text-slate-900 text-xs">{b.client_name}</div>
                                <div className="text-xs text-slate-400">{svcName(b.service_id)} · {b.time}</div>
                              </div>
                            </div>
                            <StatusBadge status={b.status} />
                          </div>
                        ))}
                      </div>
                  }
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm">Servicios más reservados</h3>
                  {services.length === 0
                    ? <p className="text-sm text-slate-400">Aún no creaste servicios</p>
                    : <div className="space-y-3">
                        {services.map(s => {
                          const count = bookings.filter(b => b.service_id === s.id).length
                          const pct   = bookings.length ? Math.round((count / bookings.length) * 100) : 0
                          return (
                            <div key={s.id}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-700 font-medium">{s.name}</span>
                                <span className="text-slate-500">{count} turnos</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
                <h1 className="text-xl font-bold text-slate-900">Turnos</h1>
                <button onClick={() => setShowNewBooking(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                  <Icon d={Icons.plus} size={16} stroke="white" /> Nuevo turno
                </button>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {[['all','Todos'],['confirmed','Confirmados'],['pending','Pendientes'],['cancelled','Cancelados']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterStatus(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterStatus === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>{['Cliente','Servicio','Fecha','Hora','Estado','Pago','Acciones'].map(h =>
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      )}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">{b.client_name?.[0]}</div>
                              <div>
                                <div className="font-medium text-slate-900 text-xs">{b.client_name}</div>
                                <div className="text-xs text-slate-400">{b.client_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">{svcName(b.service_id)}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{new Date(b.date + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{b.time}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                          <td className="px-4 py-3">
                            {b.paid
                              ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Icon d={Icons.check} size={11} stroke="#10b981" /> {fmt(b.amount)}</span>
                              : <button onClick={() => markPaid(b.id)} className="text-xs text-amber-600 font-medium border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors whitespace-nowrap">Marcar pagado</button>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {b.status !== 'confirmed' && <button onClick={() => updateStatus(b.id, 'confirmed')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="Confirmar"><Icon d={Icons.check} size={14} /></button>}
                              {b.status !== 'cancelled' && <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"    title="Cancelar"><Icon d={Icons.x} size={14} /></button>}
                              <button onClick={() => deleteBooking(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Eliminar"><Icon d={Icons.trash} size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No hay turnos para mostrar</div>}
                </div>
              </div>

              {/* Modal nuevo turno */}
              {showNewBooking && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-slate-900">Nuevo turno</h3>
                      <button onClick={() => setShowNewBooking(false)}><Icon d={Icons.x} size={18} stroke="#94a3b8" /></button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Nombre del cliente', key: 'client_name', type: 'text' },
                        { label: 'Email',              key: 'client_email', type: 'email' },
                        { label: 'Fecha',              key: 'date',        type: 'date' },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                          <input type={type} value={newBooking[key]}
                            onChange={e => setNewBooking(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Servicio</label>
                        <select value={newBooking.service_id} onChange={e => setNewBooking(p => ({ ...p, service_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                          <option value="">Seleccionar...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Hora</label>
                        <select value={newBooking.time} onChange={e => setNewBooking(p => ({ ...p, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowNewBooking(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
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
                <h1 className="text-xl font-bold text-slate-900">Servicios</h1>
                <button onClick={() => setShowNewService(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                  <Icon d={Icons.plus} size={16} stroke="white" /> Nuevo servicio
                </button>
              </div>
              {services.length === 0
                ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <p className="text-slate-400 text-sm mb-4">Aún no creaste servicios</p>
                    <button onClick={() => setShowNewService(true)} className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700">
                      + Crear primer servicio
                    </button>
                  </div>
                : <div className="grid sm:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '20' }}>
                            <Icon d={Icons.scissors} size={22} stroke={s.color} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{s.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1"><Icon d={Icons.clock} size={12} stroke="#94a3b8" /> {s.duration} min</span>
                              <span className="font-medium text-slate-700">{fmt(s.price)}</span>
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
                  <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-slate-900">Nuevo servicio</h3>
                      <button onClick={() => setShowNewService(false)}><Icon d={Icons.x} size={18} stroke="#94a3b8" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                        <input type="text" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Duración (min)</label>
                          <input type="number" value={newService.duration} onChange={e => setNewService(p => ({ ...p, duration: +e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Precio (ARS)</label>
                          <input type="number" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: +e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {['#6366f1','#ec4899','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16'].map(c => (
                            <button key={c} onClick={() => setNewService(p => ({ ...p, color: c }))}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${newService.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowNewService(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
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
              <h1 className="text-xl font-bold text-slate-900 mb-6">Pagos</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Ingresos cobrados',   val: fmt(bookings.filter(b => b.paid).reduce((s, b) => s + b.amount, 0)),                            color: 'text-emerald-600' },
                  { label: 'Pendiente de cobro',  val: fmt(bookings.filter(b => !b.paid && b.status !== 'cancelled').reduce((s, b) => s + b.amount, 0)), color: 'text-amber-600'   },
                  { label: 'Cancelados',           val: fmt(bookings.filter(b => b.status === 'cancelled').reduce((s, b) => s + b.amount, 0)),           color: 'text-red-500'     },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 text-sm">Historial de pagos</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {bookings.length === 0
                    ? <div className="text-center py-12 text-slate-400 text-sm">No hay pagos aún</div>
                    : bookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${b.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {b.client_name?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{b.client_name}</div>
                            <div className="text-xs text-slate-400">{svcName(b.service_id)} · {new Date(b.date + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900 text-sm">{fmt(b.amount)}</span>
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

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-6">Configuración</h1>
              <div className="grid gap-4 max-w-2xl">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm">Información del negocio</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Nombre del negocio', key: 'name',    placeholder: 'Mi Peluquería' },
                      { label: 'Email de contacto',  key: 'email',   placeholder: 'negocio@email.com' },
                      { label: 'Teléfono',           key: 'phone',   placeholder: '+54 11 1234-5678' },
                      { label: 'Dirección',          key: 'address', placeholder: 'Av. Corrientes 1234' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <input type="text" value={settingsForm[key]} placeholder={placeholder}
                          onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                    ))}
                  </div>
                  <button onClick={saveSettings} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                    Guardar cambios
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm">Enlace público de reservas</h3>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                    <Icon d={Icons.link} size={14} stroke="#94a3b8" />
                    <span className="text-sm text-slate-600 flex-1 break-all">{bookingLink}</span>
                    <button onClick={() => { navigator.clipboard.writeText(bookingLink); notify('Copiado') }}
                      className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap">Copiar</button>
                  </div>
                  <button onClick={() => navigate(`/b/${business?.slug}`)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                    <Icon d={Icons.eye} size={13} /> Ver página de reservas
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">Plan actual</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-900 capitalize">{business?.plan || 'free'}</span>
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
