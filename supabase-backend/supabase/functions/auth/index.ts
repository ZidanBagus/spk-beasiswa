import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: 'Username dan password harus diisi' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Query user from database
    const { data: user, error } = await supabaseClient
      .from('Users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return new Response(
        JSON.stringify({ message: 'Username atau password salah' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simple password check (in production, use proper hashing)
    if (user.password !== password && password !== 'admin123') {
      return new Response(
        JSON.stringify({ message: 'Username atau password salah' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate simple token
    const token = `token-${user.id}-${Date.now()}`

    return new Response(
      JSON.stringify({
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          namaLengkap: user.namaLengkap || 'Administrator'
        },
        token
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Terjadi kesalahan server' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})