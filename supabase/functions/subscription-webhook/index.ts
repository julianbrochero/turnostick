import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()
    if (body.type !== 'payment') return new Response('ok', { status: 200 })

    const paymentId = body.data?.id
    if (!paymentId) return new Response('ok', { status: 200 })

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    })
    const payment = await mpRes.json()

    // Solo procesar pagos de suscripción (external_reference empieza con "sub_")
    const ref = payment.external_reference || ''
    if (!ref.startsWith('sub_')) return new Response('ok', { status: 200 })

    const businessId = ref.replace('sub_', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (payment.status === 'approved') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await supabase.from('businesses').update({
        subscription_status:     'active',
        subscription_expires_at: expiresAt.toISOString(),
      }).eq('id', businessId)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})
