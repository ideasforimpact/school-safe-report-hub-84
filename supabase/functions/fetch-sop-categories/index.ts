// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())
    const body: any = await req.json().catch(() => ({}))
    const clientId: string | null = body?.client_id ?? null

    // Fetch categories for this client, plus global ones (client_id IS NULL = default seed data)
    let query = supabaseClient
      .from('sop_categories')
      .select('id, category_name')

    if (clientId) {
      query = (query as any).or(`client_id.eq.${clientId},client_id.is.null`)
    }

    const { data, error } = await (query as any).order('category_name', { ascending: true })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: err?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
