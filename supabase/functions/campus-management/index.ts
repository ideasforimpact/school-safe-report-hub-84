
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0"

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const createSupabaseClient = (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  
  return createClient(
    supabaseUrl,
    supabaseKey,
    { global: { headers: { Authorization: authHeader || "" } } }
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the Supabase client
    const supabase = createSupabaseClient(req)
    
    // Get request data based on HTTP method
    if (req.method === 'GET') {
      // Extract query parameters from URL
      const url = new URL(req.url)
      const clientId = url.searchParams.get('clientId')
      
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: "Client ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
      }
      
      // Get campuses for the specified client
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .eq('client_id', clientId)
        .order('name')
      
      if (error) {
        console.error('Error fetching campuses:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify({ campuses: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }
    
    if (req.method === 'POST') {
      // Parse request body for campus data
      const { name, clientId } = await req.json()
      
      if (!name || !clientId) {
        return new Response(
          JSON.stringify({ error: "Name and client ID are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
      }
      
      // Insert new campus
      const { data, error } = await supabase
        .from('campuses')
        .insert([{ name, client_id: clientId }])
        .select()
        .single()
      
      if (error) {
        console.error('Error adding campus:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify({ campus: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      )
    }
    
    if (req.method === 'PUT') {
      // Parse request body for campus update data
      const { id, name } = await req.json()
      
      if (!id || !name) {
        return new Response(
          JSON.stringify({ error: "Campus ID and name are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
      }
      
      // Update campus
      const { data, error } = await supabase
        .from('campuses')
        .update({ name })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating campus:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify({ campus: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }
    
    if (req.method === 'DELETE') {
      // Parse request body for campus ID
      const { id } = await req.json()
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Campus ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
      }
      
      // Delete campus
      const { error } = await supabase
        .from('campuses')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting campus:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }
    
    // Handle unsupported methods
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
