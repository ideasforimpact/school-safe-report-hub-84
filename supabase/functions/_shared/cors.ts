export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  // Allow all HTTP methods used by our edge functions, including PUT
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};