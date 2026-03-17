import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { booking_id, business_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Traer booking y business
    const [{ data: booking }, { data: business }] = await Promise.all([
      supabase.from('bookings').select('*, services(name)').eq('id', booking_id).single(),
      supabase.from('businesses').select('*').eq('id', business_id).single(),
    ])

    if (!booking || !business) throw new Error('No se encontró el turno o el negocio')
    if (!business.mp_access_token) throw new Error('MercadoPago no configurado')

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    // Crear preferencia en MercadoPago
    const preference = {
      items: [{
        title: `Seña - ${booking.services?.name || 'Turno'} en ${business.name}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: business.sena_amount || 1,
      }],
      payer: {
        name:  booking.client_name,
        email: booking.client_email,
      },
      back_urls: {
        success: `${siteUrl}/b/${business.slug}?payment=success&bid=${booking_id}`,
        failure: `${siteUrl}/b/${business.slug}?payment=failure&bid=${booking_id}`,
        pending: `${siteUrl}/b/${business.slug}?payment=pending&bid=${booking_id}`,
      },
      auto_return:          'approved',
      notification_url:     `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      external_reference:   booking_id,
      statement_descriptor: business.name,
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${business.mp_access_token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(preference),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) throw new Error(mpData.message || 'Error al crear preferencia en MercadoPago')

    return new Response(
      JSON.stringify({ init_point: mpData.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
