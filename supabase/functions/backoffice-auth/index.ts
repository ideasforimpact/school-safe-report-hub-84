
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // 1. Verify backoffice user credentials
    const { data: isValidUser, error: verifyError } = await supabaseAdmin.rpc('verify_password', {
      email,
      password_attempt: password
    });

    if (verifyError || !isValidUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Get backoffice user details
    const { data: backofficeUser, error: fetchError } = await supabaseAdmin
      .from('backoffice_users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !backofficeUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Check if user exists in auth.users
    const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(backofficeUser.id);

    let authUser;
    
    if (authCheckError || !existingAuthUser.user) {
      // 4. Create user in auth.users if doesn't exist
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: backofficeUser.id,
        email: backofficeUser.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          is_backoffice_admin: true,
          backoffice_user_id: backofficeUser.id
        }
      });

      if (createError) {
        console.error('Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      authUser = newAuthUser.user;
    } else {
      authUser = existingAuthUser.user;
    }

    // 5. Generate access token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateAccessToken(authUser.id);

    if (sessionError) {
      console.error('Error generating access token:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Update last signed in timestamp
    await supabaseAdmin
      .from('backoffice_users')
      .update({ last_signed_in: new Date().toISOString() })
      .eq('id', backofficeUser.id);

    // 7. Return session data
    return new Response(
      JSON.stringify({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_in: sessionData.expires_in,
        user: authUser,
        backoffice_user: backofficeUser
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Backoffice auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
