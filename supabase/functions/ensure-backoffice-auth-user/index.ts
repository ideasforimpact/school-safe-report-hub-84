import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseServiceRoleKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { backoffice_user_id, email, password } = await req.json();

    if (!backoffice_user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'backoffice_user_id and email are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if auth user exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(backoffice_user_id);

    if (getUserError && getUserError.status !== 404) {
      throw getUserError;
    }

    if (!existingUser?.user) {
      // Create auth user if doesn't exist
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: backoffice_user_id,
        email: email.toLowerCase(),
        password: password || crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          is_backoffice_admin: true,
          backoffice_user_id: backoffice_user_id
        }
      });

      if (createError) {
        throw createError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auth user created',
          user: newUser.user 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auth user already exists',
        user: existingUser.user 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in ensure-backoffice-auth-user:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

