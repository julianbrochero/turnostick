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
      payment_method, booking_id,
    } = await req.json()

    const siteUrl = Deno.env.get('SITE_URL') || 'https://turnostick.online'
    const cancelUrl = booking_id ? siteUrl + '/cancelar/' + booking_id : null

    const paymentLabel = payment_method === 'mercadopago'
      ? 'Seña pagada con MercadoPago'
      : payment_method === 'transfer'
        ? 'Seña abonada por transferencia'
        : 'Pago en el local'

    const rows: [string, string][] = [
      ['Servicio', service],
      ['Fecha',    fmtDate(date)],
      ['Hora',     time + ' hs'],
      ['Total',    fmtMoney(amount)],
      ['Pago',     paymentLabel],
      ...(business_address ? [['Direccion', business_address]] as [string,string][] : []),
      ...(business_phone   ? [['Telefono',  business_phone]]   as [string,string][] : []),
    ]

    const rowsHtml = rows.map(([label, value], i) =>
      '<tr>' +
        '<td style="padding:13px 0;' + (i < rows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : '') + 'color:#64748b;font-size:13px;width:42%;vertical-align:middle;">' + label + '</td>' +
        '<td style="padding:13px 0;' + (i < rows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : '') + 'color:#1e293b;font-size:13px;font-weight:600;text-align:right;width:58%;vertical-align:middle;">' + value + '</td>' +
      '</tr>'
    ).join('')

    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">' +
      '<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">' +
      '<div style="background:#31393C;padding:36px 32px 28px;text-align:center;">' +
        '<div style="display:inline-block;background:#AAFF00;border-radius:14px;width:52px;height:52px;line-height:52px;text-align:center;font-size:26px;">&#9986;</div>' +
        '<div style="color:#fff;font-size:22px;font-weight:700;margin-top:14px;">Turno confirmado</div>' +
        '<div style="color:#aab4b8;font-size:13px;margin-top:6px;">' + business_name + '</div>' +
      '</div>' +
      '<div style="padding:28px 32px;">' +
        '<p style="color:#475569;font-size:15px;margin:0 0 24px;line-height:1.5;">Hola <strong style="color:#1e293b;">' + client_name + '</strong>, tu turno fue confirmado. Aca estan todos los detalles:</p>' +
        '<div style="background:#f8fafc;border-radius:12px;padding:4px 16px;margin-bottom:24px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
            rowsHtml +
          '</table>' +
        '</div>' +
        (cancelUrl
          ? '<div style="text-align:center;margin-top:4px;">' +
              '<a href="' + cancelUrl + '" style="display:inline-block;padding:10px 24px;background:#fee2e2;color:#dc2626;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;">Cancelar turno</a>' +
              '<p style="color:#94a3b8;font-size:11px;margin:10px 0 0;line-height:1.5;">La seña no se devuelve en caso de cancelación.</p>' +
            '</div>'
          : '<p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;line-height:1.5;">Si necesitas cancelar o reprogramar, contactanos directamente.</p>'
        ) +
      '</div>' +
      '<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">' +
        '<p style="color:#94a3b8;font-size:11px;margin:0;">Enviado por <strong style="color:#31393C;">turnoStick</strong></p>' +
      '</div>' +
      '</div></body></html>'

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada')

    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const resendFromName  = Deno.env.get('RESEND_FROM_NAME')  || 'TurnoStick'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    resendFromName + ' <' + resendFromEmail + '>',
        to:      [to],
        subject: 'Turno confirmado - ' + business_name,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(JSON.stringify(err))
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
