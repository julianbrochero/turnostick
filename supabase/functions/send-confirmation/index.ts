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

serve(async (req) => {
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

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#4f46e5;padding:32px 32px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:22px;">✂️</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">¡Turno confirmado!</h1>
      <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">${business_name}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">Hola <strong style="color:#1e293b;">${client_name}</strong>, tu turno fue confirmado. Acá están todos los detalles:</p>

      <!-- Detalles -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        ${[
          ['📋 Servicio',   service],
          ['📅 Fecha',      fmtDate(date)],
          ['🕐 Hora',       `${time} hs`],
          ['💰 Total',      fmtMoney(amount)],
          ['💳 Pago',       paymentLabel],
          ...(business_address ? [['📍 Dirección', business_address]] : []),
          ...(business_phone   ? [['📞 Teléfono',  business_phone]]   : []),
        ].map(([label, value]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#64748b;font-size:13px;">${label}</span>
            <span style="color:#1e293b;font-size:13px;font-weight:600;text-align:right;max-width:60%;">${value}</span>
          </div>
        `).join('')}
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

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'TurnoStick <turnos@turnostick.com>',
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
