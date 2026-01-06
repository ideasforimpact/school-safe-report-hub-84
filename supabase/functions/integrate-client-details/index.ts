// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from "../_shared/cors.ts";


serve(async (req) => {
  const corsHeadersWithOrigin = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeadersWithOrigin,
    });
  }
  // if (req.method !== 'GET') {
  //   return new Response(
  //     JSON.stringify({ error: 'Method not allowed' }),
  //     {
  //       status: 405,
  //       headers: {
  //         ...corsHeadersWithOrigin,
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );
  // }
  const integrationApiKey = Deno.env.get('INTEGRATION_API_KEY');
  const connectedSchoolBaseUrl = Deno.env.get('CONNECTED_SCHOOL_BASE_URL')

  if (!integrationApiKey) {
    return new Response(
      JSON.stringify({
        success: true,
        data: [],
      }),
      { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }

  const externalApiUrl = `${connectedSchoolBaseUrl}/functions/v1/get_schools_list`;

  try {
    const externalResponse = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': integrationApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!externalResponse.ok) {
      console.error(`[Search Client ] External API error: ${externalResponse.status} ${externalResponse.statusText}`);
      // Return empty array if external API fails
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        { status: 500, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
      );
    }

    const externalData = await externalResponse.json();
    console.log(`[Search Client ] External API response:`, externalData);

    // Transform external students with is_external: true
    // const externalStudents = externalData.data || [];
    const schools = externalData.schools ?? [];

    console.log(`[Search Client ] Found ${schools.length} school(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        data: schools,
      }),
      {
        status: 200,
        headers: {
          ...corsHeadersWithOrigin,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (externalError) {
    console.error('[Search Client ] Error calling external API:', externalError);
    // Return empty array if external API call fails
    return new Response(
      JSON.stringify({
        success: true,
        data: [],
      }),
      { status: 200, headers: { ...corsHeadersWithOrigin, 'Content-Type': 'application/json' } }
    );
  }
})


