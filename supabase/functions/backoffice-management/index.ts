
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

// Create a Supabase client
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseServiceRoleKey();
const supabase = createClient(supabaseUrl, supabaseKey);

interface BackofficeUser {
  email: string;
  password: string;
  is_saas_admin?: boolean;
}

async function handleCreateBackofficeUser(req: BackofficeUser): Promise<any> {
  const { email, password, is_saas_admin = true } = req;

  // Hash the password using our SQL function
  const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
    password
  });
  
  if (hashError) {
    return { error: 'Failed to hash password', details: hashError };
  }

  // Insert the user
  const { data, error } = await supabase
    .from('backoffice_users')
    .insert({
      email,
      password: hashedPassword,
      is_saas_admin
    })
    .select('id, email, is_saas_admin, created_at')
    .single();

  if (error) {
    return { error: 'Failed to create user', details: error };
  }

  return { data };
}

async function handleUpdateBackofficeUser(req: { id: string } & Partial<BackofficeUser>): Promise<any> {
  const { id, email, password, is_saas_admin } = req;
  const updates: any = {};
  
  if (email) updates.email = email;
  if (is_saas_admin !== undefined) updates.is_saas_admin = is_saas_admin;
  
  // If password is provided, hash it
  if (password) {
    const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
      password
    });
    
    if (hashError) {
      return { error: 'Failed to hash password', details: hashError };
    }
    
    updates.password = hashedPassword;
  }
  
  // Update the user
  const { data, error } = await supabase
    .from('backoffice_users')
    .update(updates)
    .eq('id', id)
    .select('id, email, is_saas_admin, created_at, updated_at')
    .single();

  if (error) {
    return { error: 'Failed to update user', details: error };
  }

  return { data };
}

async function handleDeleteBackofficeUser(req: { id: string }): Promise<any> {
  const { id } = req;

  const { data, error } = await supabase
    .from('backoffice_users')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    return { error: 'Failed to delete user', details: error };
  }

  return { data };
}

async function handleListBackofficeUsers(): Promise<any> {
  const { data, error } = await supabase
    .from('backoffice_users')
    .select('id, email, is_saas_admin, created_at, updated_at, last_signed_in')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: 'Failed to list users', details: error };
  }

  return { data };
}

// The main function
serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get the request body
    const reqBody = await req.json();
    const { operation, ...params } = reqBody;
    let result;

    switch (operation) {
      case 'create':
        result = await handleCreateBackofficeUser(params);
        break;
      case 'update':
        result = await handleUpdateBackofficeUser(params);
        break;
      case 'delete':
        result = await handleDeleteBackofficeUser(params);
        break;
      case 'list':
        result = await handleListBackofficeUsers();
        break;
      default:
        result = { error: 'Invalid operation' };
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
