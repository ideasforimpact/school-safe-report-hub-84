
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
    console.log('🔍 Backoffice auth function called');
    
    const { email, password } = await req.json();
    console.log('📧 Email:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Verify backoffice user credentials
    console.log('🔐 Verifying password...');
    const { data: isValidUser, error: verifyError } = await supabaseAdmin.rpc('verify_password', {
      email: email.toLowerCase(),
      password_attempt: password
    });

    console.log('🔐 Password verification result:', isValidUser);
    console.log('🔐 Password verification error:', verifyError);

    if (verifyError) {
      console.error('❌ Password verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: verifyError.message }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!isValidUser) {
      console.log('❌ Invalid credentials');
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Get backoffice user details
    console.log('👤 Fetching backoffice user details...');
    const { data: backofficeUser, error: fetchError } = await supabaseAdmin
      .from('backoffice_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log('👤 Backoffice user:', backofficeUser);
    console.log('👤 Fetch error:', fetchError);

    if (fetchError || !backofficeUser) {
      console.error('❌ User not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Check if user exists in auth.users, create if not
    console.log('🔍 Checking if auth user exists...');
    const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(backofficeUser.id);

    let authUser;
    
    if (authCheckError || !existingAuthUser.user) {
      console.log('🆕 Creating new auth user...');
      // 4. Create user in auth.users if doesn't exist
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: backofficeUser.id,
        email: backofficeUser.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          is_backoffice_admin: true,
          backoffice_user_id: backofficeUser.id,
          full_name: 'Backoffice Admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create auth user', details: createError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      authUser = newAuthUser.user;
      console.log('✅ Auth user created successfully');
    } else {
      authUser = existingAuthUser.user;
      console.log('✅ Using existing auth user');
    }

    // 5. Generate access token for the user
    console.log('🎫 Generating access token...');
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateAccessToken(authUser.id);

    if (sessionError || !sessionData) {
      console.error('❌ Error generating access token:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session', details: sessionError?.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Update last signed in timestamp
    console.log('📅 Updating last signed in timestamp...');
    await supabaseAdmin
      .from('backoffice_users')
      .update({ last_signed_in: new Date().toISOString() })
      .eq('id', backofficeUser.id);

    console.log('✅ Backoffice authentication successful!');

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
    console.error('💥 Backoffice auth error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
