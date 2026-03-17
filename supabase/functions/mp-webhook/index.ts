import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()

    // MP envía varios tipos de notificaciones, solo nos interesan pagos aprobados
    if (body.type !== 'payment') return new Response('ok', { status: 200 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Buscar el booking por external_reference para obtener el access_token del negocio
    const paymentId = body.data?.id
    if (!paymentId) return new Response('ok', { status: 200 })

    // Primero necesitamos saber de qué negocio es para usar su token
    // Buscamos un booking reciente con mp_payment_id pendiente
    // Usamos el token global si está configurado, sino intentamos con el del negocio
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')

    // Consultar el pago a MercadoPago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    })
    const payment = await mpRes.json()

    const bookingId = payment.external_reference
    if (!bookingId) return new Response('ok', { status: 200 })

    if (payment.status === 'approved') {
      // Actualizar booking
      const { data: booking } = await supabase
        .from('bookings')
        .update({
          paid:           true,
          status:         'confirmed',
          payment_status: 'paid',
          mp_payment_id:  String(paymentId),
        })
        .eq('id', bookingId)
        .select('*, businesses(name, slug, phone, address), services(name)')
        .single()

      if (booking) {
        // Enviar email de confirmación
        await supabase.functions.invoke('send-confirmation', {
          body: {
            to:               booking.client_email,
            client_name:      booking.client_name,
            service:          booking.services?.name,
            date:             booking.date,
            time:             booking.time,
            amount:           booking.amount,
            business_name:    booking.businesses?.name,
            business_phone:   booking.businesses?.phone,
            business_address: booking.businesses?.address,
            payment_method:   'mercadopago',
          },
        })
      }
    } else if (payment.status === 'rejected') {
      await supabase
        .from('bookings')
        .update({ payment_status: 'rejected', status: 'cancelled' })
        .eq('id', bookingId)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})
