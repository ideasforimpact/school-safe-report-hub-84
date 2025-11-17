/**
 * Environment variable utility for Edge Functions
 * 
 * Handles both local development (without SUPABASE_ prefix) and 
 * cloud deployment (with SUPABASE_ prefix) automatically.
 * 
 * Local: Uses URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
 * Cloud: Falls back to SUPABASE_URL, SUPABASE_ANON_KEY, etc.
 */

/**
 * Get Supabase URL - tries local name first, then cloud name
 * For local development on Linux, replaces 127.0.0.1 with Docker gateway IP
 */
export function getSupabaseUrl(): string {
  let url = Deno.env.get('URL') ?? 
            Deno.env.get('SUPABASE_URL') ?? 
            '';
  
  // On Linux, when running in Docker, replace 127.0.0.1 with Docker gateway IP
  // This allows Edge Functions to reach the host machine's Supabase API
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    // Use Docker bridge gateway IP (172.17.0.1) for Linux containers
    // This works because Edge Functions run in Docker and need to reach host
    url = url.replace('127.0.0.1', '172.17.0.1').replace('localhost', '172.17.0.1');
  }
  
  return url;
}

/**
 * Get Supabase Anon Key - tries local name first, then cloud name
 */
export function getSupabaseAnonKey(): string {
  return Deno.env.get('ANON_KEY') ?? 
         Deno.env.get('SUPABASE_ANON_KEY') ?? 
         '';
}

/**
 * Get Supabase Service Role Key - tries local name first, then cloud name
 */
export function getSupabaseServiceRoleKey(): string {
  return Deno.env.get('SERVICE_ROLE_KEY') ?? 
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 
         '';
}

/**
 * Get Database URL - tries local name first, then cloud name
 */
export function getDatabaseUrl(): string {
  return Deno.env.get('DB_URL') ?? 
         Deno.env.get('SUPABASE_DB_URL') ?? 
         '';
}

/**
 * Get any environment variable with fallback support
 * Tries the provided key first, then tries with SUPABASE_ prefix
 */
export function getEnv(key: string, fallback: string = ''): string {
  return Deno.env.get(key) ?? 
         Deno.env.get(`SUPABASE_${key}`) ?? 
         fallback;
}

