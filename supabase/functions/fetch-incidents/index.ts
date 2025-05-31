
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchIncidentsRequest {
  client_id: string;
  employee_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, employee_id }: FetchIncidentsRequest = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    //console.log('Fetching incidents for client:', client_id);

    // Validate employee access if employee_id is provided
    if (employee_id) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('client_id')
        .eq('id', employee_id)
        .single();

      if (employeeError || !employee || employee.client_id !== client_id) {
        console.error('Employee validation failed:', employeeError);
        return new Response(
          JSON.stringify({ error: 'Access denied: Invalid employee or client association' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch incidents with all related data
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_categories(id, name),
        incident_subcategories(id, name),
        incident_status(id, name),
        incident_priorities(id, name, weight, color),
        incident_report_types(id, name),
        facilities(id, name),
        created_by_employee:employees!incidents_created_by_fkey(id, first_name, last_name, email),
        assigned_to_employee:employees!incidents_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error);
      return new Response(
        JSON.stringify({ error: `Failed to fetch incidents: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    //console.log(`Successfully fetched ${incidents?.length || 0} incidents for client ${client_id}`);

    return new Response(
      JSON.stringify({ 
        incidents: incidents || [],
        count: incidents?.length || 0,
        client_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in fetch-incidents function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
