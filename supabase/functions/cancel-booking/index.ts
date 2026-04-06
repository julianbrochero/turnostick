import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { booking_id, action } = await req.json()

    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, businesses(name, slug), services(name)')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      return new Response(JSON.stringify({ error: 'Turno no encontrado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Solo obtener info del turno
    if (action !== 'cancel') {
      return new Response(JSON.stringify({ booking }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cancelar el turno
    if (booking.status === 'cancelled') {
      return new Response(JSON.stringify({ already_cancelled: true, booking }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ ok: true, booking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
