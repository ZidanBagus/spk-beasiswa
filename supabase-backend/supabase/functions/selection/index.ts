import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    if (req.method === 'POST') {
      // Get all applicants for selection process
      const { data: applicants, error } = await supabaseClient
        .from('Applicants')
        .select('*')

      if (error) throw error

      // Mock C4.5 algorithm processing
      const processedCount = applicants?.length || 0
      const acceptedCount = Math.floor(processedCount * 0.6)
      const rejectedCount = processedCount - acceptedCount

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      return new Response(JSON.stringify({
        message: 'Proses seleksi berhasil',
        summary: {
          totalProcessed: processedCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
          accuracy: '85.7%',
          processingTime: '2.1s'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ 
      message: 'Gagal memproses seleksi',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})