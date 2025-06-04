
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { client_id } = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`Fetching dashboard stats for client_id: ${client_id}`);

    // Get open incidents count
    const { data: openIncidents, error: openIncidentsError } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .in('status_id', ['open', 'new', 'in-progress']); // Adjust status values as needed

    if (openIncidentsError) {
      console.error('Error fetching open incidents:', openIncidentsError);
    }

    // Get active assessments count
    const { data: activeAssessments, error: activeAssessmentsError } = await supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .in('status', ['New', 'In Progress', 'Submitted']);

    if (activeAssessmentsError) {
      console.error('Error fetching active assessments:', activeAssessmentsError);
    }

    // Get total employees count
    const { data: totalEmployees, error: totalEmployeesError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id);

    if (totalEmployeesError) {
      console.error('Error fetching total employees:', totalEmployeesError);
    }

    // Get employees with verification documents
    const { data: verifiedEmployees, error: verifiedEmployeesError } = await supabase
      .from('employee_documents')
      .select('employee_id')
      .in('verification_status', ['verified', 'pending', 'submitted']);

    if (verifiedEmployeesError) {
      console.error('Error fetching verified employees:', verifiedEmployeesError);
    }

    // Get unique verified employees count
    const uniqueVerifiedEmployees = verifiedEmployees ? 
      new Set(verifiedEmployees.map(doc => doc.employee_id)).size : 0;

    // Get total vehicles count
    const { data: totalVehicles, error: totalVehiclesError } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id);

    if (totalVehiclesError) {
      console.error('Error fetching total vehicles:', totalVehiclesError);
    }

    // Get verified vehicles count
    const { data: verifiedVehicles, error: verifiedVehiclesError } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('verification_status', 'verified');

    if (verifiedVehiclesError) {
      console.error('Error fetching verified vehicles:', verifiedVehiclesError);
    }

    // Get incidents from last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: lastMonthIncidents, error: lastMonthError } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', oneMonthAgo.toISOString());

    if (lastMonthError) {
      console.error('Error fetching last month incidents:', lastMonthError);
    }

    // Get incidents from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: lastSixMonthsIncidents, error: lastSixMonthsError } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', sixMonthsAgo.toISOString());

    if (lastSixMonthsError) {
      console.error('Error fetching last 6 months incidents:', lastSixMonthsError);
    }

    const stats = {
      openIncidents: openIncidents?.length || 0,
      activeAssessments: activeAssessments?.length || 0,
      totalEmployees: totalEmployees?.length || 0,
      verifiedEmployees: uniqueVerifiedEmployees,
      totalVehicles: totalVehicles?.length || 0,
      verifiedVehicles: verifiedVehicles?.length || 0,
      lastMonthIncidents: lastMonthIncidents?.length || 0,
      lastSixMonthsIncidents: lastSixMonthsIncidents?.length || 0
    };

    console.log('Dashboard stats:', stats);

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in dashboard-stats function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
