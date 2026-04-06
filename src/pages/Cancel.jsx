import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function Cancel() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyCancelled, setAlreadyCancelled] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('cancel-booking', {
          body: { booking_id: bookingId, action: 'get' },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        if (data?.booking?.status === 'cancelled') setAlreadyCancelled(true)
        setBooking(data.booking)
      } catch (err) {
        setError(err.message || 'No se pudo cargar el turno')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId, action: 'cancel' },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.already_cancelled) setAlreadyCancelled(true)
      else setDone(true)
    } catch (err) {
      setError(err.message || 'No se pudo cancelar el turno')
    } finally {
      setCancelling(false)
    }
  }

  const hadSena = booking?.payment_method === 'mercadopago' || booking?.payment_method === 'transfer'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Header */}
        <div className="bg-[#31393C] px-8 py-7 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-3"
            style={{ background: '#AAFF00' }}>
            ✂️
          </div>
          <div className="text-white font-bold text-lg">turnoStick</div>
        </div>

        <div className="px-8 py-7">

          {error && (
            <div className="text-center">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-slate-700 font-semibold mb-1">Algo salió mal</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          )}

          {!error && alreadyCancelled && (
            <div className="text-center">
              <div className="text-4xl mb-3">ℹ️</div>
              <p className="text-slate-700 font-semibold mb-1">El turno ya fue cancelado</p>
              <p className="text-slate-500 text-sm">Este turno ya no está activo.</p>
            </div>
          )}

          {!error && done && (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-slate-700 font-semibold mb-1">Turno cancelado</p>
              <p className="text-slate-500 text-sm">
                Tu turno fue cancelado correctamente.
                {hadSena && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    Recordá que la seña no se devuelve.
                  </span>
                )}
              </p>
            </div>
          )}

          {!error && !done && !alreadyCancelled && booking && (
            <>
              <p className="text-slate-700 text-sm mb-5 leading-relaxed">
                Estás por cancelar el siguiente turno en{' '}
                <strong className="text-slate-900">{booking.businesses?.name}</strong>:
              </p>

              {/* Detalle del turno */}
              <div className="bg-slate-50 rounded-xl px-4 py-1 mb-5">
                {[
                  ['Servicio', booking.services?.name || '-'],
                  ['Fecha',    fmtDate(booking.date)],
                  ['Hora',     booking.time + ' hs'],
                  ...(booking.amount ? [['Total', fmtMoney(booking.amount)]] : []),
                ].map(([label, value], i, arr) => (
                  <div key={label}
                    className={`flex justify-between py-3 text-sm ${i < arr.length - 1 ? 'border-b border-slate-200' : ''}`}>
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Aviso seña */}
              {hadSena && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
                  <p className="text-orange-700 text-xs font-medium leading-relaxed">
                    ⚠️ La seña abonada no será devuelta al cancelar el turno.
                  </p>
                </div>
              )}

              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar turno'}
              </button>

              <p className="text-center text-slate-400 text-xs mt-4">
                Esta acción no se puede deshacer.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
