import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const fmtDate = (dateStr: string) =>
  new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const buildHtml = (p: {
  client_name: string, service: string, date: string, time: string,
  amount: number, business_name: string, business_phone: string, business_address: string,
}) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#31393C;padding:32px 32px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(170,255,0,.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:22px;">⏰</span>
      </div>
      <h1 style="color:#AAFF00;margin:0;font-size:22px;font-weight:700;">Recordatorio de turno</h1>
      <p style="color:#a0aab0;margin:6px 0 0;font-size:14px;">${p.business_name}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Hola <strong style="color:#1e293b;">${p.client_name}</strong>, te recordamos que en pocas horas tenés un turno reservado:
      </p>

      <!-- Detalles -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${[
          ['📋 Servicio',  p.service],
          ['📅 Fecha',     fmtDate(p.date)],
          ['🕐 Hora',      `${p.time} hs`],
          ['💰 Total',     fmtMoney(p.amount)],
          ...(p.business_address ? [['📍 Dirección', p.business_address]] : []),
          ...(p.business_phone   ? [['📞 Teléfono',  p.business_phone]]   : []),
        ].map(([label, value]) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:40%;vertical-align:top;">${label}</td>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;width:60%;vertical-align:top;">${value}</td>
          </tr>
        `).join('')}
        </table>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
        Si necesitás cancelar o reprogramar, contactanos directamente.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado por <strong>turnoStick</strong> · turnostick.com</p>
    </div>
  </div>
</body>
</html>`

serve(async (req: any) => {
  // Permite invocación manual (POST vacío) o desde cron (GET)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey   = Deno.env.get('RESEND_API_KEY')!
    const fromEmail   = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const fromName    = Deno.env.get('RESEND_FROM_NAME')  || 'TurnoStick'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ventana: turnos entre 1h45m y 3h desde ahora (UTC)
    // La función corre cada 30 min → cada turno queda dentro de la ventana exactamente una vez
    // El flag reminder_sent evita duplicados aunque la ventana sea más amplia
    const now      = new Date()
    const minDt    = new Date(now.getTime() + 1.75 * 60 * 60 * 1000) // +1h45m
    const maxDt    = new Date(now.getTime() + 3.00 * 60 * 60 * 1000) // +3h

    // Formateamos en zona Argentina (UTC-3)
    const toARG = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000)
    const argMin = toARG(minDt)
    const argMax = toARG(maxDt)

    const dateMin = argMin.toISOString().slice(0, 10) // YYYY-MM-DD
    const timeMin = argMin.toISOString().slice(11, 16) // HH:MM
    const dateMax = argMax.toISOString().slice(0, 10)
    const timeMax = argMax.toISOString().slice(11, 16)

    // Traer turnos dentro de la ventana que no tengan recordatorio enviado
    const { data: bookings, error: fetchErr } = await supabase
      .from('bookings')
      .select(`
        id, date, time, client_name, client_email, amount, service_id,
        businesses!inner ( name, phone, address ),
        services ( name )
      `)
      .eq('reminder_sent', false)
      .not('client_email', 'is', null)
      .not('status', 'in', '("cancelled","reserved")')
      .or(
        // mismo día: time entre timeMin y timeMax
        `and(date.eq.${dateMin},time.gte.${timeMin},time.lte.${timeMax})` +
        // si el rango cruza medianoche (raro pero posible)
        (dateMin !== dateMax
          ? `,and(date.eq.${dateMin},time.gte.${timeMin}),and(date.eq.${dateMax},time.lte.${timeMax})`
          : '')
      )

    if (fetchErr) throw fetchErr

    const results: { id: string; ok: boolean; error?: string }[] = []

    for (const b of bookings ?? []) {
      const biz = (b as any).businesses
      const svc = (b as any).services

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    `${fromName} <${fromEmail}>`,
            to:      [b.client_email],
            subject: `⏰ Recordatorio: tu turno en ${biz.name} es hoy`,
            html: buildHtml({
              client_name:      b.client_name,
              service:          svc?.name ?? 'Servicio',
              date:             b.date,
              time:             b.time,
              amount:           b.amount,
              business_name:    biz.name,
              business_phone:   biz.phone,
              business_address: biz.address,
            }),
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message)
        }

        // Marcar como enviado
        await supabase.from('bookings').update({ reminder_sent: true }).eq('id', b.id)
        results.push({ id: b.id, ok: true })
      } catch (e: any) {
        results.push({ id: b.id, ok: false, error: e.message })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
