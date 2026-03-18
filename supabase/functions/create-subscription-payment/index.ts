import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { business_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single()

    if (!business) throw new Error('Negocio no encontrado')

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN no configurado')

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    const preference = {
      items: [{
        title: 'turnoStick — Suscripción mensual',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: 14999,
      }],
      payer: {
        name: business.name,
      },
      back_urls: {
        success: `${siteUrl}/admin?sub=success`,
        failure: `${siteUrl}/admin?sub=failure`,
        pending: `${siteUrl}/admin?sub=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook`,
      external_reference: `sub_${business_id}`,
      statement_descriptor: 'turnoStick',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) throw new Error(mpData.message || 'Error al crear preferencia')

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
