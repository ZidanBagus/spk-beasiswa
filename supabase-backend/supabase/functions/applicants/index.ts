import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const id = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      if (id && id !== 'applicants') {
        // Get single applicant
        const { data, error } = await supabaseClient
          .from('Applicants')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // Get all applicants with pagination
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const search = url.searchParams.get('search') || ''
        
        let query = supabaseClient
          .from('Applicants')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        if (search) {
          query = query.or(`nama.ilike.%${search}%,nim.ilike.%${search}%`)
        }

        const { data, error, count } = await query
          .range((page - 1) * limit, page * limit - 1)

        if (error) throw error

        return new Response(JSON.stringify({
          applicants: data,
          totalItems: count,
          currentPage: page,
          totalPages: Math.ceil((count || 0) / limit)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabaseClient
        .from('Applicants')
        .insert(body)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({
        message: 'Applicant created successfully',
        applicant: data
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'PUT' && id) {
      const body = await req.json()
      const { data, error } = await supabaseClient
        .from('Applicants')
        .update(body)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({
        message: 'Applicant updated successfully',
        applicant: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'DELETE' && id) {
      const { error } = await supabaseClient
        .from('Applicants')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({
        message: 'Applicant deleted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})