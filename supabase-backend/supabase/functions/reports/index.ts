import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status') || ''

    // Get selection results (mock data for now)
    let query = supabaseClient
      .from('Applicants')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    const { data: applicants, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    // Transform data to include selection results
    const results = (applicants || []).map(applicant => ({
      ...applicant,
      statusKelulusan: Math.random() > 0.5 ? 'Terima' : 'Tidak',
      confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
      tanggalSeleksi: new Date().toISOString().split('T')[0]
    }))

    return new Response(JSON.stringify({
      results: results,
      total: count || 0,
      page: page,
      limit: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      results: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})