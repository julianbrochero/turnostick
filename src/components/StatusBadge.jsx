export default function StatusBadge({ status }) {
  const cfg = {
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmado' },
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pendiente'  },
    cancelled: { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400',     label: 'Cancelado'  },
  }[status] || {}

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
