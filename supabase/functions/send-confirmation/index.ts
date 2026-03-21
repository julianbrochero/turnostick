import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const fmtDate = (dateStr: string) =>
  new Date(dateStr + 'T12:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

serve(async (req: any) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      to, client_name, service, date, time, amount,
      business_name, business_phone, business_address,
      payment_method,
    } = await req.json()

    const paymentLabel = payment_method === 'mercadopago'
      ? '✅ Seña pagada con MercadoPago'
      : payment_method === 'transfer'
        ? '🏦 Seña abonada por transferencia'
        : '🏠 Pago en el local'

    // SVG icons (14px, stroke-based, email-safe inline)
    const svg = (path: string) =>
      `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${path}</svg>`
      )}" width="14" height="14" style="vertical-align:middle;margin-right:6px;" />`

    const iconScissors  = svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>')
    const iconCalendar  = svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')
    const iconClock     = svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')
    const iconDollar    = svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')
    const iconCard      = svg('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>')
    const iconMapPin    = svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>')
    const iconPhone     = svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>')

    const rows: [string, string][] = [
      [iconScissors + 'Servicio', service],
      [iconCalendar + 'Fecha',    fmtDate(date)],
      [iconClock    + 'Hora',     `${time} hs`],
      [iconDollar   + 'Total',    fmtMoney(amount)],
      [iconCard     + 'Pago',     paymentLabel],
      ...(business_address ? [[iconMapPin + 'Dirección', business_address]] as [string,string][] : []),
      ...(business_phone   ? [[iconPhone  + 'Teléfono',  business_phone]]   as [string,string][] : []),
    ]

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#31393C;padding:36px 32px 28px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding-bottom:14px;">
          <div style="display:inline-block;background:#AAFF00;border-radius:14px;width:52px;height:52px;line-height:52px;text-align:center;font-size:26px;">✂️</div>
        </td></tr>
        <tr><td align="center">
          <div style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">¡Turno confirmado!</div>
        </td></tr>
        <tr><td align="center" style="padding-top:6px;">
          <div style="color:#aab4b8;font-size:13px;">${business_name}</div>
        </td></tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.5;">
        Hola <strong style="color:#1e293b;">${client_name}</strong>, tu turno fue confirmado. Acá están todos los detalles:
      </p>

      <!-- Detalles -->
      <div style="background:#f8fafc;border-radius:12px;padding:4px 16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${rows.map(([label, value], i) => `
          <tr>
            <td style="padding:13px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''} color:#64748b;font-size:13px;width:42%;vertical-align:middle;">${label}</td>
            <td style="padding:13px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''} color:#1e293b;font-size:13px;font-weight:600;text-align:right;width:58%;vertical-align:middle;">${value}</td>
          </tr>
        `).join('')}
        </table>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;line-height:1.5;">
        Si necesitás cancelar o reprogramar, contactanos directamente.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado por <strong style="color:#31393C;">turnoStick</strong> · turnostick.com</p>
    </div>
  </div>
</body>
</html>`

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada')

    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const resendFromName = Deno.env.get('RESEND_FROM_NAME') || 'TurnoStick'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `${resendFromName} <${resendFromEmail}>`,
        to:      [to],
        subject: `✅ Turno confirmado – ${business_name}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Error al enviar email')
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
