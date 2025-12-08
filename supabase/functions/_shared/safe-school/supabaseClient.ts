/**
 * Supabase client initialization for SafeSchool Auth Service
 * Uses service role key for admin operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../env.ts';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase admin client
 */
export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    const url = getSupabaseUrl();
    const serviceKey = getSupabaseServiceRoleKey();
    
    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }

    supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

/**
 * Verify a Supabase JWT token and get user info
 */
export async function verifySupabaseToken(token: string): Promise<{
  user: { id: string; email: string };
  error?: Error;
}> {
  const supabase = getSupabaseAdminClient();
  
  try {
    // Use the admin API to verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        user: { id: '', email: '' },
        error: error || new Error('User not found'),
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
      },
    };
  } catch (error) {
    return {
      user: { id: '', email: '' },
      error: error instanceof Error ? error : new Error('Token verification failed'),
    };
  }
}

