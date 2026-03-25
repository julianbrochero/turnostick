import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Icons } from '../components/Icon'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { user, business, loading } = useAuth()

  // Demo state
  const [demoTab, setDemoTab]               = useState('admin')
  const [bookingStep, setBookingStep]       = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate]     = useState(null)
  const [selectedTime, setSelectedTime]     = useState(null)

  const goToApp = () => {
    if (loading) return
    if (user && business) navigate('/admin')
    else navigate('/register')
  }

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  const switchTab = (tab) => {
    setDemoTab(tab)
    if (tab === 'booking') {
      setBookingStep(1)
      setSelectedService(null)
      setSelectedDate(null)
      setSelectedTime(null)
    }
  }

  useEffect(() => {
    if (loading) return
    if (user && business) navigate('/admin', { replace: true })
    else if (user && !business) navigate('/register', { replace: true })
  }, [user, business, loading])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const features = [
    { icon: Icons.calendar, title: 'Agenda Digital 24/7',       desc: 'Tus clientes reservan en cualquier momento desde cualquier dispositivo.' },
    { icon: Icons.dollar,   title: 'Cobros Anticipados',         desc: 'Reducí las inasistencias hasta un 80% cobrando por adelantado.' },
    { icon: Icons.bell,     title: 'Recordatorios Automáticos',  desc: 'Notificaciones por email para que nadie olvide su turno.' },
    { icon: Icons.chart,    title: 'Estadísticas en Tiempo Real',desc: 'Reportes detallados sobre reservas, ingresos y clientes.' },
    { icon: Icons.users,    title: 'Multi-Profesional',          desc: 'Gestioná varios profesionales desde un único panel centralizado.' },
    { icon: Icons.settings, title: 'Configuración Simple',       desc: 'Lista en 5 minutos. Sin tarjeta de crédito para empezar.' },
  ]

  const plans = [
    { name: 'Prueba',   price: 'Gratis',  period: '7 días',   highlight: false, features: ['7 días de prueba', 'Reservas ilimitadas', 'Notificaciones email', 'Pagos online', 'Estadísticas completas', 'Sin tarjeta de crédito'] },
    { name: 'Premium',  price: '$14.999', period: '/mes ARS', highlight: true,  features: ['Reservas ilimitadas', 'Calendarios ilimitados', 'Notificaciones email', 'Pagos online', 'Estadísticas avanzadas', 'Sin marca de agua', 'Soporte prioritario'] },
  ]

  // ─── Demo mock data ────────────────────────────────────────────────────────
  const mockStats = [
    { label: 'Turnos hoy',        value: '12',     change: '+3 vs ayer',    color: 'text-indigo-600' },
    { label: 'Ingresos del mes',  value: '$47.600', change: '+18% este mes', color: 'text-green-600' },
    { label: 'Clientes nuevos',   value: '8',      change: 'esta semana',   color: 'text-blue-600' },
    { label: 'Confirmados',       value: '94%',    change: '+2% promedio',  color: 'text-purple-600' },
  ]

  const mockBookings = [
    { name: 'Ana García',   service: 'Corte + Peinado',  pro: 'Valentina', time: '10:00', status: 'confirmed', paid: true  },
    { name: 'Marcos R.',    service: 'Coloración',        pro: 'Valentina', time: '11:30', status: 'pending',   paid: false },
    { name: 'Lucía P.',     service: 'Manicura',          pro: 'Sofía',     time: '12:00', status: 'confirmed', paid: true  },
    { name: 'Julián T.',    service: 'Corte Hombre',      pro: 'Roberto',   time: '14:00', status: 'confirmed', paid: true  },
    { name: 'Marta G.',     service: 'Barba + Corte',     pro: 'Roberto',   time: '15:30', status: 'cancelled', paid: false },
  ]

  const mockServices = [
    { name: 'Corte de cabello',     price: '$3.500',  duration: '45 min',  color: 'bg-blue-500'   },
    { name: 'Coloración completa',  price: '$8.000',  duration: '120 min', color: 'bg-purple-500' },
    { name: 'Manicura + Pedicura',  price: '$4.500',  duration: '60 min',  color: 'bg-pink-500'   },
  ]

  const mockTimes  = ['09:00', '09:45', '10:30', '11:15', '14:00', '15:30', '16:15']
  const chartBars  = [42, 68, 55, 83, 61, 95, 72]
  const chartDays  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  // March 2025 starts on Saturday → 6 leading empty cells
  const calLeading = 6
  const calAvailable = [26, 27, 28, 31]

  const sidebarNav = [
    { icon: Icons.home,     label: 'Dashboard',      active: true  },
    { icon: Icons.calendar, label: 'Turnos',          active: false },
    { icon: Icons.scissors, label: 'Servicios',       active: false },
    { icon: Icons.clock,    label: 'Agenda',          active: false },
    { icon: Icons.dollar,   label: 'Pagos',           active: false },
    { icon: Icons.settings, label: 'Configuración',   active: false },
  ]

  const statusStyle = {
    confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    pending:   'bg-amber-50  text-amber-700  border border-amber-100',
    cancelled: 'bg-red-50    text-red-600    border border-red-100',
  }
  const statusLabel = { confirmed: 'Confirmado', pending: 'Pendiente', cancelled: 'Cancelado' }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-slate-900 text-lg tracking-tight">turnoStick</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Características</a>
            <a href="#demo"     className="hover:text-indigo-600 transition-colors">Demo</a>
            <a href="#pricing"  className="hover:text-indigo-600 transition-colors">Precios</a>
            <a href="#reviews"  className="hover:text-indigo-600 transition-colors">Reseñas</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium">Ingresar</button>
            <button onClick={goToApp} className="bg-[#31393C] text-indigo-600 text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">Comenzar gratis</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            Más de 200 negocios en Argentina
          </div>
          <h1 className="reveal text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6" style={{ transitionDelay: '80ms' }}>
            El sistema de turnos<br />
            <span className="text-indigo-600">que simplifica</span> tu negocio
          </h1>
          <p className="reveal text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ transitionDelay: '160ms' }}>
            Agenda online 24/7, cobros anticipados y recordatorios automáticos para peluquerías, barberías, consultorios y más.
          </p>
          <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4" style={{ transitionDelay: '240ms' }}>
            <button onClick={goToApp} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#31393C] text-indigo-600 font-bold px-7 py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg">
              Empezar gratis
              <Icon d={Icons.arrow} size={18} stroke="#AAFF00" />
            </button>
            <button onClick={scrollToDemo} className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-7 py-3.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Icon d={Icons.eye} size={18} />
              Ver demo
            </button>
          </div>
          <p className="reveal text-xs text-slate-400 mt-4" style={{ transitionDelay: '320ms' }}>Sin tarjeta de crédito · 7 días gratis · Configuración en 5 minutos</p>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['200+','Negocios activos'],['80%','Menos inasistencias'],['1 min','Para reservar'],['24/7','Disponibilidad']].map(([n, l], i) => (
            <div key={l} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="text-3xl font-extrabold text-indigo-600 mb-1">{n}</div>
              <div className="text-sm text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="reveal text-3xl font-bold text-slate-900 mb-3">Todo lo que necesitás en un solo lugar</h2>
            <p className="reveal text-slate-500" style={{ transitionDelay: '80ms' }}>Funcionalidades pensadas para negocios argentinos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }, i) => (
              <div key={title} className="reveal p-6 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all group" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 bg-[#31393C] rounded-xl flex items-center justify-center mb-4">
                  <Icon d={icon} size={20} stroke="#AAFF00" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ───────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="reveal inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
              Demo interactiva — sin registro
            </div>
            <h2 className="reveal text-3xl md:text-4xl font-bold text-slate-900 mb-3">Mirá cómo funciona turnoStick</h2>
            <p className="reveal text-slate-500 max-w-xl mx-auto" style={{ transitionDelay: '80ms' }}>
              Explorá el panel del negocio y la experiencia de reserva que viven tus clientes. Podés interactuar con la demo.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="reveal flex justify-center mb-8" style={{ transitionDelay: '120ms' }}>
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
              <button
                onClick={() => switchTab('admin')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  demoTab === 'admin'
                    ? 'bg-[#31393C] text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon d={Icons.chart}    size={15} stroke={demoTab === 'admin' ? '#AAFF00' : 'currentColor'} />
                Panel del negocio
              </button>
              <button
                onClick={() => switchTab('booking')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  demoTab === 'booking'
                    ? 'bg-[#31393C] text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon d={Icons.calendar} size={15} stroke={demoTab === 'booking' ? '#AAFF00' : 'currentColor'} />
                Reserva del cliente
              </button>
            </div>
          </div>

          {/* Browser frame */}
          <div className="reveal rounded-2xl overflow-hidden shadow-2xl border border-slate-200" style={{ transitionDelay: '160ms' }}>

            {/* Chrome bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-xs text-slate-400 font-mono border border-slate-200">
                {demoTab === 'admin'
                  ? '🔒 app.turnostick.com/admin'
                  : '🔒 turnostick.com/b/peluqueria-valentina'}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                En vivo
              </div>
            </div>

            {/* ── ADMIN MOCKUP ────────────────────────────────────────────── */}
            {demoTab === 'admin' && (
              <div className="flex bg-slate-100" style={{ height: '520px' }}>

                {/* Sidebar */}
                <div className="bg-[#31393C] w-44 flex-shrink-0 flex flex-col py-4 overflow-hidden">
                  <div className="px-4 pb-4 mb-2 border-b border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <img src="/favicon2.png" alt="turnoStick" className="w-7 h-7 flex-shrink-0" />
                      <span className="text-white text-xs font-bold leading-tight">Peluquería<br/>Valentina</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-400 text-[10px]">Prueba: 5 días restantes</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 space-y-0.5">
                    {sidebarNav.map(({ icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          active
                            ? 'bg-slate-700 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon d={icon} size={13} stroke={active ? '#AAFF00' : 'currentColor'} />
                        {label}
                      </div>
                    ))}
                  </nav>
                  <div className="px-4 pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">VG</div>
                      <div>
                        <div className="text-white text-[10px] font-semibold">Valentina G.</div>
                        <div className="text-slate-500 text-[9px]">Admin</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto p-5">

                  {/* Top bar */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Dashboard</h3>
                      <p className="text-xs text-slate-400">Miércoles, 25 de marzo 2025</p>
                    </div>
                    <button className="flex items-center gap-1.5 bg-[#31393C] text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors" style={{ color: '#AAFF00' }}>
                      <Icon d={Icons.plus} size={12} stroke="#AAFF00" />
                      Nuevo turno
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {mockStats.map(s => (
                      <div key={s.label} className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-100">
                        <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-semibold">{s.label}</div>
                        <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{s.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table + Chart row */}
                  <div className="grid grid-cols-3 gap-3">

                    {/* Bookings table */}
                    <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Turnos de hoy</span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-semibold">12 turnos</span>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide">Cliente</th>
                            <th className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide">Servicio</th>
                            <th className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide hidden lg:table-cell">Profesional</th>
                            <th className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide">Hora</th>
                            <th className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockBookings.map((b, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                                    {b.name[0]}
                                  </div>
                                  <span className="text-xs font-medium text-slate-800">{b.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{b.service}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 hidden lg:table-cell">{b.pro}</td>
                              <td className="px-4 py-2.5 text-xs font-mono font-semibold text-slate-700">{b.time}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle[b.status]}`}>
                                  {statusLabel[b.status]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Revenue chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-700">Ingresos 7 días</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">+18%</span>
                      </div>
                      <div className="flex items-end gap-1.5 flex-1">
                        {chartBars.map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-t-md transition-all ${i === 6 ? 'bg-indigo-600' : 'bg-slate-100'}`}
                              style={{ height: `${h}%`, minHeight: '6px' }}
                            />
                            <span className="text-[9px] text-slate-400 font-semibold">{chartDays[i]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <div className="text-lg font-extrabold text-slate-900">$47.600</div>
                        <div className="text-[10px] text-slate-400">acumulado este mes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BOOKING MOCKUP ──────────────────────────────────────────── */}
            {demoTab === 'booking' && (
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 flex items-start justify-center p-8" style={{ minHeight: '520px' }}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

                  {/* Business header */}
                  <div className="bg-[#31393C] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>
                      <div>
                        <div className="text-white font-bold text-sm">Peluquería Valentina</div>
                        <div className="text-slate-400 text-xs mt-0.5">📍 Palermo, Buenos Aires · Lun–Sáb</div>
                      </div>
                    </div>
                  </div>

                  {/* Steps indicator */}
                  <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50">
                    {['Servicio', 'Fecha', 'Horario', 'Confirmar'].map((s, i) => (
                      <div key={s} className="flex items-center flex-1">
                        <div className="flex items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                            i < bookingStep - 1
                              ? 'bg-indigo-600 text-white'
                              : i === bookingStep - 1
                              ? 'bg-[#31393C] text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {i < bookingStep - 1 ? '✓' : i + 1}
                          </div>
                          <span className={`text-[10px] font-semibold hidden sm:inline transition-colors ${
                            i === bookingStep - 1 ? 'text-slate-900' : i < bookingStep - 1 ? 'text-indigo-600' : 'text-slate-300'
                          }`}>{s}</span>
                        </div>
                        {i < 3 && (
                          <div className={`flex-1 h-0.5 mx-1 transition-all ${i < bookingStep - 1 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step content */}
                  <div className="p-5">

                    {/* ── Step 1: Select service ── */}
                    {bookingStep === 1 && (
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-4">¿Qué servicio necesitás?</p>
                        <div className="space-y-2.5">
                          {mockServices.map(s => (
                            <button
                              key={s.name}
                              onClick={() => { setSelectedService(s.name); setBookingStep(2) }}
                              className="w-full flex items-center justify-between p-3.5 border-2 border-slate-100 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700">{s.name}</div>
                                  <div className="text-xs text-slate-400">{s.duration}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{s.price}</span>
                                <Icon d={Icons.arrow} size={14} stroke="#6366f1" />
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                          <Icon d={Icons.lock} size={12} />
                          Pago seguro con Mercado Pago
                        </div>
                      </div>
                    )}

                    {/* ── Step 2: Select date ── */}
                    {bookingStep === 2 && (
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">Elegí una fecha</p>
                        <p className="text-xs text-slate-400 mb-4">{selectedService}</p>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-800">Marzo 2025</span>
                          <div className="flex gap-1">
                            <button className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xs">‹</button>
                            <button className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xs">›</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                          {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => (
                            <div key={d} className="text-[10px] text-slate-400 font-semibold py-1">{d}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 text-center">
                          {[...Array(calLeading)].map((_, i) => <div key={`e${i}`} />)}
                          {[...Array(31)].map((_, i) => {
                            const day = i + 1
                            const past = day <= 25
                            const available = calAvailable.includes(day)
                            const selected = selectedDate === day
                            return (
                              <button
                                key={day}
                                disabled={!available}
                                onClick={() => { if (available) { setSelectedDate(day); setBookingStep(3) } }}
                                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  selected
                                    ? 'bg-[#31393C] text-white font-bold'
                                    : available
                                    ? 'hover:bg-indigo-100 hover:text-indigo-700 text-slate-900 cursor-pointer'
                                    : past
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                              >{day}</button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setBookingStep(1)}
                          className="mt-4 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          ← Cambiar servicio
                        </button>
                      </div>
                    )}

                    {/* ── Step 3: Select time ── */}
                    {bookingStep === 3 && (
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">Elegí un horario</p>
                        <p className="text-xs text-slate-400 mb-4">
                          {['Jueves','Viernes','Sábado','','','','Martes'][calAvailable.indexOf(selectedDate)]} {selectedDate} de marzo · {selectedService}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {mockTimes.map(t => (
                            <button
                              key={t}
                              onClick={() => { setSelectedTime(t); setBookingStep(4) }}
                              className={`py-2.5 border-2 rounded-xl text-sm font-bold transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 ${
                                selectedTime === t
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-slate-100 text-slate-800'
                              }`}
                            >{t}</button>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                          <Icon d={Icons.clock} size={11} />
                          Los horarios en gris ya están reservados
                        </div>
                        <button
                          onClick={() => setBookingStep(2)}
                          className="mt-3 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          ← Cambiar fecha
                        </button>
                      </div>
                    )}

                    {/* ── Step 4: Confirmed ── */}
                    {bookingStep === 4 && (
                      <div className="text-center py-2">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon d={Icons.check} size={28} stroke="#16a34a" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">¡Turno reservado!</h4>
                        <p className="text-sm text-slate-500 mb-5">Te enviamos la confirmación por email 📧</p>

                        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 mb-5">
                          {[
                            ['Servicio', selectedService],
                            ['Fecha', `${['Jueves','Viernes','Sábado','','','','Martes'][calAvailable.indexOf(selectedDate)]} ${selectedDate} de marzo`],
                            ['Horario', `${selectedTime} hs`],
                            ['Profesional', 'Valentina G.'],
                            ['Total abonado', mockServices.find(s => s.name === selectedService)?.price || ''],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">{k}</span>
                              <span className="font-semibold text-slate-900">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
                          <Icon d={Icons.bell} size={12} />
                          Recordatorio automático 24 hs antes
                        </div>

                        <button
                          onClick={() => { setBookingStep(1); setSelectedService(null); setSelectedDate(null); setSelectedTime(null) }}
                          className="w-full bg-[#31393C] font-bold py-3 rounded-xl text-sm hover:bg-slate-700 transition-colors"
                          style={{ color: '#AAFF00' }}
                        >
                          Reservar otro turno
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <p className="text-center text-sm text-slate-400 mt-4">
            {demoTab === 'admin'
              ? 'Panel de control que ve el dueño del negocio — datos de ejemplo'
              : 'Hacé clic en los servicios, fechas y horarios para ver el flujo completo'}
          </p>

          {/* Feature callouts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { icon: Icons.calendarCheck, title: 'Reserva en 3 pasos', desc: 'Tu cliente elige servicio, fecha y horario en menos de 1 minuto.' },
              { icon: Icons.bell,          title: 'Recordatorios auto',  desc: 'Email automático 24 hs antes para reducir inasistencias.' },
              { icon: Icons.dollar,        title: 'Cobro anticipado',    desc: 'Integración con Mercado Pago para cobrar al momento de reservar.' },
              { icon: Icons.chart,         title: 'Stats en tiempo real',desc: 'Ingresos, turnos y clientes actualizados al instante.' },
            ].map(({ icon, title, desc }, i) => (
              <div key={title} className="reveal flex gap-3 p-4 bg-white border border-slate-100 rounded-xl" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon d={icon} size={16} stroke="#6366f1" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-0.5">{title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="reveal text-3xl font-bold text-slate-900 mb-3">Precios simples y transparentes</h2>
            <p className="reveal text-slate-500" style={{ transitionDelay: '80ms' }}>Sin costos ocultos ni comisiones por reserva</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map(({ name, price, period, highlight, features: feats }, i) => (
              <div key={name} className={`reveal rounded-2xl p-8 ${highlight ? 'bg-[#31393C] text-white shadow-xl' : 'bg-white border border-slate-200'}`} style={{ transitionDelay: `${i * 120}ms` }}>
                <div className={`text-sm font-semibold mb-1 ${highlight ? 'text-indigo-600' : 'text-slate-500'}`}>{name}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{price}</span>
                  <span className="text-sm mb-1 text-slate-400">{period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {feats.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Icon d={Icons.check} size={11} stroke="#AAFF00" />
                      </div>
                      <span className={highlight ? 'text-slate-300' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={goToApp} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${highlight ? 'bg-indigo-600 text-slate-900 hover:bg-indigo-700' : 'bg-[#31393C] text-indigo-600 hover:bg-slate-700'}`}>
                  {name === 'Prueba' ? 'Probar 7 días gratis' : 'Suscribirme ahora'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ────────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="reveal text-3xl font-bold text-slate-900 mb-3">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Carolina M.', role: 'Peluquería en Buenos Aires', text: 'Pasé de 40 a 120 clientes al mes. Las inasistencias bajaron un 80% desde que activé los pagos anticipados.' },
              { name: 'Ricardo P.',  role: 'Barbería en Medellín',       text: 'Mis clientes adoran poder reservar a cualquier hora desde el celu. Súper fácil de configurar.' },
              { name: 'Valentina R.',role: 'Centro de Estética en Santiago', text: 'Gestiono 3 profesionales y todas las sucursales desde un solo panel. Excelente.' },
            ].map(({ name, role, text }, i) => (
              <div key={name} className="reveal p-6 border border-slate-100 rounded-2xl" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Icon key={i} d={Icons.star} size={14} fill="#fbbf24" stroke="#fbbf24" />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">"{text}"</p>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{name}</div>
                  <div className="text-xs text-slate-400">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#31393C]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="reveal text-3xl font-bold text-white mb-4">¡Empezá gratis hoy mismo!</h2>
          <p className="reveal text-slate-400 mb-8" style={{ transitionDelay: '80ms' }}>7 días gratis sin tarjeta de crédito. Después $14.999 ARS/mes.</p>
          <div className="reveal" style={{ transitionDelay: '160ms' }}>
            <button onClick={goToApp} className="bg-indigo-600 text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
              Crear cuenta gratuita →
            </button>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 text-center text-sm text-slate-400 border-t border-slate-100">
        © 2025 TurnoStick · Todos los derechos reservados
      </footer>
    </div>
  )
}
