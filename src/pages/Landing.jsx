import { useNavigate } from 'react-router-dom'
import { Icon, Icons } from '../components/Icon'

export default function Landing() {
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <img src="/logo.png" alt="turnoStick" className="w-8 h-8" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">turnoStick</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Características</a>
            <a href="#pricing"  className="hover:text-indigo-600 transition-colors">Precios</a>
            <a href="#reviews"  className="hover:text-indigo-600 transition-colors">Reseñas</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}    className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium">Ingresar</button>
            <button onClick={() => navigate('/register')} className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Comenzar gratis</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Más de 200 negocios en Argentina
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            El sistema de turnos<br />
            <span className="text-indigo-600">que simplifica</span> tu negocio
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Agenda online 24/7, cobros anticipados y recordatorios automáticos para peluquerías, barberías, consultorios y más.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Empezar gratis
              <Icon d={Icons.arrow} size={18} stroke="white" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-7 py-3.5 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all">
              <Icon d={Icons.eye} size={18} />
              Ver demo
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">Sin tarjeta de crédito · 7 días gratis · Configuración en 5 minutos</p>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['200+','Negocios activos'],['80%','Menos inasistencias'],['1 min','Para reservar'],['24/7','Disponibilidad']].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl font-extrabold text-indigo-600 mb-1">{n}</div>
              <div className="text-sm text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Todo lo que necesitás en un solo lugar</h2>
            <p className="text-slate-500">Funcionalidades pensadas para negocios latinoamericanos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="p-6 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <Icon d={icon} size={20} stroke="#4A6C0E" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Precios simples y transparentes</h2>
            <p className="text-slate-500">Sin costos ocultos ni comisiones por reserva</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map(({ name, price, period, highlight, features: feats }) => (
              <div key={name} className={`rounded-2xl p-8 ${highlight ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border border-slate-200'}`}>
                <div className={`text-sm font-semibold mb-1 ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{name}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{price}</span>
                  <span className={`text-sm mb-1 ${highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {feats.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${highlight ? 'bg-white/20' : 'bg-indigo-50'}`}>
                        <Icon d={Icons.check} size={11} stroke={highlight ? 'white' : '#4A6C0E'} />
                      </div>
                      <span className={highlight ? 'text-white' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/register')} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {name === 'Prueba' ? 'Probar 7 días gratis' : 'Suscribirme ahora'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Carolina M.', role: 'Peluquería en Buenos Aires', text: 'Pasé de 40 a 120 clientes al mes. Las inasistencias bajaron un 80% desde que activé los pagos anticipados.' },
              { name: 'Ricardo P.',  role: 'Barbería en Medellín',       text: 'Mis clientes adoran poder reservar a cualquier hora desde el celu. Súper fácil de configurar.' },
              { name: 'Valentina R.',role: 'Centro de Estética en Santiago', text: 'Gestiono 3 profesionales y todas las sucursales desde un solo panel. Excelente.' },
            ].map(({ name, role, text }) => (
              <div key={name} className="p-6 border border-slate-100 rounded-2xl">
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

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¡Empezá gratis hoy mismo!</h2>
          <p className="text-indigo-200 mb-8">7 días gratis sin tarjeta de crédito. Después $14.999 ARS/mes.</p>
          <button onClick={() => navigate('/register')} className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
            Crear cuenta gratuita →
          </button>
        </div>
      </section>

      <footer className="py-8 px-6 text-center text-sm text-slate-400 border-t border-slate-100">
        © 2025 TurnoStick · Todos los derechos reservados
      </footer>
    </div>
  )
}
