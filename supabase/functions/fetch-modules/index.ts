
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Parse request parameters - only need userInfo now
    const { userInfo } = await req.json();
    
    // Log user details if provided
    if (userInfo) {
      console.log(`User requesting modules: ${JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        isSaasOwner: userInfo.isSaasOwner
      })}`);
    } else {
      console.log('No user info provided with module request');
    }
    
    // Determine level based on user role
    const level = userInfo?.role === 'saas_owner' || userInfo?.isSaasOwner ? 'backoffice' : 'client';
    console.log(`Determined module level: ${level} based on user role`);
    
    // Query the modules table
    let query = supabase.from('modules').select('*');
    
    if (level === 'backoffice') {
      // For backoffice users, fetch modules with level = 'backoffice'
      console.log('Fetching backoffice modules');
      query = query.eq('level', 'backoffice');
    } else {
      // For client users, fetch modules with level != 'backoffice'
      console.log('Fetching client modules');
      query = query.neq('level', 'backoffice');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} modules`);
    
    // Return the modules data
    return new Response(
      JSON.stringify({ 
        modules: data || [],
        success: true 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching modules:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
