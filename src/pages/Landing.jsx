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
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [selectedTime, setSelectedTime]     = useState(null)
  const [demoName, setDemoName]             = useState('')
  const [demoEmail, setDemoEmail]           = useState('')

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
      setSelectedDayIdx(0)
      setSelectedTime(null)
      setDemoName('')
      setDemoEmail('')
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
    { label: 'Total turnos',     value: '12',      icon: Icons.calendar, color: 'text-slate-900' },
    { label: 'Confirmados',      value: '9',       icon: Icons.check,    color: 'text-slate-900' },
    { label: 'Pendientes',       value: '2',       icon: Icons.clock,    color: 'text-slate-900' },
    { label: 'Ingresos cobrados',value: '$47.600', icon: Icons.dollar,   color: 'text-slate-900' },
  ]

  const mockBookings = [
    { name: 'Ana García',   service: 'Corte + Peinado',  pro: 'Valentina', time: '10:00', status: 'confirmed', paid: true  },
    { name: 'Marcos R.',    service: 'Coloración',        pro: 'Valentina', time: '11:30', status: 'pending',   paid: false },
    { name: 'Lucía P.',     service: 'Manicura',          pro: 'Sofía',     time: '12:00', status: 'confirmed', paid: true  },
    { name: 'Julián T.',    service: 'Corte Hombre',      pro: 'Roberto',   time: '14:00', status: 'confirmed', paid: true  },
    { name: 'Marta G.',     service: 'Barba + Corte',     pro: 'Roberto',   time: '15:30', status: 'cancelled', paid: false },
  ]

  const mockServices = [
    { name: 'Corte de cabello',    price: '$3.500', duration: 45,  emoji: '✂️', hex: '#4A6C0E' },
    { name: 'Coloración completa', price: '$8.000', duration: 120, emoji: '🎨', hex: '#7c3aed' },
    { name: 'Manicura + Pedicura', price: '$4.500', duration: 60,  emoji: '💅', hex: '#ec4899' },
  ]

  const mockDays = [
    { day: 'mar', num: 25, closed: false },
    { day: 'mié', num: 26, closed: false },
    { day: 'jue', num: 27, closed: false },
    { day: 'vie', num: 28, closed: false },
    { day: 'sáb', num: 29, closed: false },
    { day: 'dom', num: 30, closed: true  },
    { day: 'lun', num: 31, closed: false },
  ]

  const mockTimes    = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30']
  const mockBooked   = new Set(['10:00', '14:00'])
  const chartBars    = [42, 68, 55, 83, 61, 95, 72]
  const chartDays    = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

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
                  ? '🔒 app.turnostick.online/admin'
                  : '🔒 turnostick.online/b/peluqueria-valentina'}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                En vivo
              </div>
            </div>

            {/* ── ADMIN MOCKUP ────────────────────────────────────────────── */}
            {demoTab === 'admin' && (
              <div className="bg-slate-50 flex flex-col" style={{ height: '520px' }}>

                {/* Mobile header (< md) — igual al real */}
                <header className="md:hidden bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3 flex-shrink-0">
                  <img src="/favicon2.png" alt="turnoStick" className="w-6 h-6 flex-shrink-0" />
                  <span className="font-bold text-slate-900 text-sm flex-1">Peluquería Valentina</span>
                  <span className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium">
                    <Icon d={Icons.eye} size={13} stroke="#9ca3af" /> Ver
                  </span>
                  <span className="flex items-center gap-1.5 text-xs bg-[#31393C] px-3 py-1.5 rounded-lg font-medium" style={{ color: '#AAFF00' }}>
                    <Icon d={Icons.copy} size={13} stroke="#AAFF00" /> Link
                  </span>
                </header>

                {/* Middle: sidebar (desktop) + content */}
                <div className="flex flex-1 overflow-hidden">

                  {/* Desktop sidebar (md+) */}
                  <aside className="hidden md:flex bg-[#31393C] w-44 flex-shrink-0 flex-col py-4">
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
                        <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          active ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                        }`}>
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
                  </aside>

                  {/* Main content — scrollable */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5">

                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Dashboard</h3>
                        <p className="text-xs text-slate-400">Miércoles, 25 de marzo 2025</p>
                      </div>
                      <button className="flex items-center gap-1.5 bg-[#31393C] text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors" style={{ color: '#AAFF00' }}>
                        <Icon d={Icons.plus} size={12} stroke="#AAFF00" />
                        <span className="hidden sm:inline">Nuevo turno</span>
                        <span className="sm:hidden">Nuevo</span>
                      </button>
                    </div>

                    {/* Stat cards: 2-col mobile, 4-col desktop */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 md:mb-5">
                      {mockStats.map(s => (
                        <div key={s.label} className="bg-white rounded-2xl p-3 md:p-3.5 shadow-sm border border-slate-100">
                          <Icon d={s.icon} size={16} stroke="#aab4b8" />
                          <div className={`text-2xl font-bold mt-2 mb-0.5 ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: tabla + gráfico */}
                    <div className="hidden md:grid grid-cols-3 gap-3">
                      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-sm">Turnos de hoy</span>
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-semibold">12 turnos</span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-50">
                              {['Cliente','Servicio','Hora','Estado'].map(h => (
                                <th key={h} className="text-left text-[10px] text-slate-400 px-4 py-2 font-semibold uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {mockBookings.map((b, i) => (
                              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">{b.name[0]}</div>
                                    <span className="text-xs font-medium text-slate-800">{b.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-xs text-slate-500">{b.service}</td>
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
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-700">Ingresos 7 días</span>
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">+18%</span>
                        </div>
                        <div className="flex items-end gap-1.5 flex-1">
                          {chartBars.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className={`w-full rounded-t-md ${i === 6 ? 'bg-indigo-600' : 'bg-slate-100'}`} style={{ height: `${h}%`, minHeight: '6px' }} />
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

                    {/* Mobile: lista de próximos turnos (igual al dashboard real) */}
                    <div className="md:hidden space-y-3">
                      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-4 text-sm">Próximos turnos</h3>
                        <div className="space-y-3">
                          {mockBookings.filter(b => b.status !== 'cancelled').map((b, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#31393C] rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">{b.name[0]}</div>
                                <div>
                                  <div className="font-medium text-slate-900 text-xs">{b.name}</div>
                                  <div className="text-xs text-slate-400">{b.service} · {b.time}</div>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle[b.status]}`}>
                                {statusLabel[b.status]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Tu página está activa</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">turnostick.online/b/peluqueria-valentina</div>
                        </div>
                        <span className="flex items-center gap-1.5 bg-[#31393C] text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: '#AAFF00' }}>
                          <Icon d={Icons.copy} size={12} stroke="#AAFF00" /> Copiar
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Mobile bottom nav (< md) — igual al real */}
                <nav className="md:hidden bg-white/95 border-t border-slate-100 flex-shrink-0">
                  <div className="flex items-stretch h-14">
                    {[
                      { icon: Icons.chart,    label: 'Dashboard', active: true  },
                      { icon: Icons.calendar, label: 'Turnos',    active: false },
                      { icon: Icons.clock,    label: 'Horarios',  active: false },
                      { icon: Icons.menu,     label: 'Más',       active: false },
                    ].map(({ icon, label, active }) => (
                      <div key={label} className="flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:opacity-60">
                        <Icon d={icon} size={22} stroke={active ? '#31393C' : '#c8d0d3'} />
                        <span className={`text-[10px] leading-none tracking-wide ${active ? 'font-semibold text-[#31393C]' : 'text-slate-300'}`}>{label}</span>
                        {active && <div className="w-1 h-1 rounded-full bg-indigo-600" />}
                      </div>
                    ))}
                  </div>
                </nav>

              </div>
            )}

            {/* ── BOOKING MOCKUP ──────────────────────────────────────────── */}
            {demoTab === 'booking' && (
              <div className="bg-slate-50" style={{ minHeight: '520px', maxHeight: '520px', overflowY: 'auto' }}>

                {/* Header — idéntico al real */}
                <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="/favicon2.png" alt="turnoStick" className="w-8 h-8 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-tight">Peluquería Valentina</div>
                        <div className="text-xs text-slate-800 font-semibold leading-tight tracking-wide">turnoStick</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Icon d={Icons.home} size={13} /> Inicio
                    </span>
                  </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-6">
                  {/* Stepper — idéntico al real */}
                  {bookingStep < 4 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        {['Servicio','Fecha','Datos','Pago'].map((label, i) => (
                          <div key={label} className={`flex items-center gap-1 text-xs font-medium ${i + 1 <= bookingStep ? 'text-[#31393C]' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              i + 1 < bookingStep  ? 'bg-[#31393C] text-indigo-600' :
                              i + 1 === bookingStep ? 'bg-indigo-600 text-slate-900' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {i + 1 < bookingStep ? <Icon d={Icons.check} size={12} stroke="#AAFF00" /> : i + 1}
                            </div>
                            <span className="hidden sm:block">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-1 bg-slate-200 rounded-full">
                        <div className="h-1 bg-indigo-600 rounded-full transition-all" style={{ width: `${((bookingStep - 1) / 3) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Card — idéntica al real */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">

                    {/* Step 1 — Servicio */}
                    {bookingStep === 1 && (
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Elegí un servicio</h2>
                        <p className="text-sm text-slate-500 mb-5">Seleccioná el servicio que querés reservar</p>
                        <div className="grid gap-3">
                          {mockServices.map(s => (
                            <button key={s.name}
                              onClick={() => { setSelectedService(s.name); setBookingStep(2) }}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedService === s.name ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: s.hex + '20' }}>
                                  {s.emoji}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Icon d={Icons.clock} size={11} stroke="#94a3b8" /> {s.duration} min
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">{s.price}</div>
                                {selectedService === s.name && (
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center ml-auto mt-1">
                                    <Icon d={Icons.check} size={10} stroke="white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2 — Fecha y hora */}
                    {bookingStep === 2 && (
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Elegí fecha y hora</h2>
                        <p className="text-sm text-slate-500 mb-4">Seleccioná cuándo querés tu turno</p>

                        {/* Day picker — scroll horizontal igual al real */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                          {mockDays.map((d, i) => (
                            <button key={i} disabled={d.closed}
                              onClick={() => { if (!d.closed) { setSelectedDayIdx(i); setSelectedTime(null) } }}
                              className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border-2 transition-all flex-shrink-0 ${
                                d.closed ? 'border-slate-100 opacity-40 cursor-not-allowed' :
                                selectedDayIdx === i ? 'border-indigo-500 bg-indigo-50' :
                                'border-slate-100 hover:border-slate-200'
                              }`}>
                              <span className="text-xs text-slate-500 capitalize">{i === 0 ? 'HOY' : d.day}</span>
                              <span className="text-lg font-bold text-slate-900">{d.num}</span>
                              <span className="text-xs text-slate-400">mar</span>
                            </button>
                          ))}
                        </div>

                        {/* Horarios — 4 columnas igual al real */}
                        {mockDays[selectedDayIdx]?.closed
                          ? <div className="text-center py-8 bg-slate-50 rounded-xl">
                              <div className="text-2xl mb-2">🔒</div>
                              <p className="text-slate-500 text-sm font-medium">No hay turnos disponibles este día</p>
                              <p className="text-slate-400 text-xs mt-1">Seleccioná otra fecha</p>
                            </div>
                          : <div className="grid grid-cols-4 gap-2">
                              {mockTimes.map(t => {
                                const taken = mockBooked.has(t)
                                return (
                                  <button key={t} disabled={taken}
                                    onClick={() => !taken && setSelectedTime(t)}
                                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                                      taken ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50' :
                                      selectedTime === t ? 'bg-indigo-600 text-slate-900 font-bold border-indigo-600' :
                                      'border-slate-200 text-slate-700 hover:border-indigo-600 hover:bg-indigo-50'
                                    }`}>{t}</button>
                                )
                              })}
                            </div>
                        }
                      </div>
                    )}

                    {/* Step 3 — Datos */}
                    {bookingStep === 3 && (
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Tus datos</h2>
                        <p className="text-sm text-slate-500 mb-5">Para enviarte la confirmación</p>
                        <div className="space-y-4">
                          {[
                            { label: 'Nombre completo *', type: 'text',  placeholder: 'Ej: María García',    value: demoName,  set: setDemoName  },
                            { label: 'Email *',           type: 'email', placeholder: 'tu@email.com',         value: demoEmail, set: setDemoEmail },
                            { label: 'Teléfono',          type: 'tel',   placeholder: '+54 9 11 1234-5678',   value: '',        set: () => {}     },
                          ].map(({ label, type, placeholder, value, set }) => (
                            <div key={label}>
                              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                              <input type={type} placeholder={placeholder} value={value}
                                onChange={e => set(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 4 — Confirmado */}
                    {bookingStep === 4 && (
                      <div className="py-2">
                        <div className="text-center mb-5">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon d={Icons.check} size={30} stroke="#10b981" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 mb-1">¡Turno reservado!</h2>
                          <p className="text-slate-500 text-sm">
                            El negocio te confirma el turno. Detalles enviados a <strong>{demoEmail || 'tu email'}</strong>
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm mb-5">
                          {[
                            ['Negocio',   'Peluquería Valentina'],
                            ['Servicio',  selectedService],
                            ['Fecha',     `${mockDays[selectedDayIdx]?.day} ${mockDays[selectedDayIdx]?.num} de marzo`],
                            ['Hora',      `${selectedTime} hs`],
                            ['Total',     mockServices.find(s => s.name === selectedService)?.price],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-slate-500">{k}</span>
                              <span className="font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => { setBookingStep(1); setSelectedService(null); setSelectedDayIdx(0); setSelectedTime(null); setDemoName(''); setDemoEmail('') }}
                          className="w-full py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors mb-2">
                          Reservar otro turno
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navegación — idéntica al real */}
                  {bookingStep < 4 && bookingStep > 1 && (
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => { setBookingStep(s => s - 1); setSelectedTime(null) }}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                        ← Volver
                      </button>
                      <button
                        onClick={() => bookingStep === 3 ? setBookingStep(4) : setBookingStep(s => s + 1)}
                        disabled={
                          (bookingStep === 2 && !selectedTime) ||
                          (bookingStep === 3 && (!demoName || !demoEmail))
                        }
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                          (bookingStep === 2 && selectedTime) || (bookingStep === 3 && demoName && demoEmail)
                            ? 'bg-[#31393C] text-indigo-600 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}>
                        {bookingStep === 3 ? 'Confirmar reserva →' : 'Continuar →'}
                      </button>
                    </div>
                  )}
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
