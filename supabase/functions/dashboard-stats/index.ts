
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { client_id } = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "client_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Fetching dashboard statistics for client:', client_id);

    // Get current date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Fetch all statistics in parallel
    const [
      incidentsResult,
      employeesResult,
      assessmentsResult,
      vehiclesResult
    ] = await Promise.all([
      // Open incidents and critical incidents
      supabase
        .from('incidents')
        .select(`
          id,
          created_at,
          incident_status!status_id(name),
          incident_priorities!priority_id(name)
        `)
        .eq('client_id', client_id),

      // Total employees for verification status
      supabase
        .from('employees')
        .select(`
          id,
          employee_documents(
            id,
            verification_status,
            document_type_id,
            employee_document_type!document_type_id(name)
          )
        `)
        .eq('client_id', client_id)
        .eq('status', true),

      // Total assessments
      supabase
        .from('assessments')
        .select('id, created_at')
        .eq('client_id', client_id),

      // Vehicles requiring action
      supabase
        .from('vehicles')
        .select(`
          id,
          verification_status,
          status,
          vehicle_documents(
            id,
            documents
          )
        `)
        .eq('client_id', client_id)
    ]);

    if (incidentsResult.error) throw incidentsResult.error;
    if (employeesResult.error) throw employeesResult.error;
    if (assessmentsResult.error) throw assessmentsResult.error;
    if (vehiclesResult.error) throw vehiclesResult.error;

    const incidents = incidentsResult.data || [];
    const employees = employeesResult.data || [];
    const assessments = assessmentsResult.data || [];
    const vehicles = vehiclesResult.data || [];

    // Calculate incident statistics
    const openIncidents = incidents.filter(inc => 
      inc.incident_status?.name === 'Open' || inc.incident_status?.name === 'In Progress'
    ).length;

    const criticalIncidents = incidents.filter(inc => 
      (inc.incident_status?.name === 'Open' || inc.incident_status?.name === 'In Progress') &&
      inc.incident_priorities?.name === 'Critical'
    ).length;

    const todayIncidents = incidents.filter(inc => {
      const incidentDate = new Date(inc.created_at);
      return incidentDate >= todayStart;
    }).length;

    const weekIncidents = incidents.filter(inc => {
      const incidentDate = new Date(inc.created_at);
      return incidentDate >= weekStart;
    }).length;

    // Calculate verification statistics
    let totalEmployees = employees.length;
    let pendingVerification = 0;
    
    employees.forEach(employee => {
      const documents = employee.employee_documents || [];
      const hasPendingDocs = documents.some(doc => 
        doc.verification_status === 'pending' || 
        doc.verification_status === null ||
        doc.verification_status === 'failed'
      );
      if (hasPendingDocs) {
        pendingVerification++;
      }
    });

    // Calculate vehicle statistics
    const vehiclesRequiringAction = vehicles.filter(vehicle => {
      return (
        vehicle.verification_status === 'pending' ||
        vehicle.verification_status === 'failed' ||
        vehicle.verification_status === null ||
        vehicle.status === 'inactive'
      );
    }).length;

    const dashboardStats = {
      openIncidents: {
        count: openIncidents,
        incidents: incidents.filter(inc => 
          inc.incident_status?.name === 'Open' || inc.incident_status?.name === 'In Progress'
        ).map(inc => ({
          id: inc.id,
          status: inc.incident_status?.name,
          priority: inc.incident_priorities?.name,
          created_at: inc.created_at
        }))
      },
      verificationStatus: {
        pending: pendingVerification,
        total: totalEmployees,
        percentage: totalEmployees > 0 ? Math.round((pendingVerification / totalEmployees) * 100) : 0
      },
      totalAssessments: {
        count: assessments.length,
        assessments: assessments.map(ass => ({
          id: ass.id,
          created_at: ass.created_at
        }))
      },
      openCriticalIncidents: {
        count: criticalIncidents,
        incidents: incidents.filter(inc => 
          (inc.incident_status?.name === 'Open' || inc.incident_status?.name === 'In Progress') &&
          inc.incident_priorities?.name === 'Critical'
        ).map(inc => ({
          id: inc.id,
          status: inc.incident_status?.name,
          priority: inc.incident_priorities?.name,
          created_at: inc.created_at
        }))
      },
      todayIncidents: {
        count: todayIncidents,
        incidents: incidents.filter(inc => {
          const incidentDate = new Date(inc.created_at);
          return incidentDate >= todayStart;
        }).map(inc => ({
          id: inc.id,
          status: inc.incident_status?.name,
          priority: inc.incident_priorities?.name,
          created_at: inc.created_at
        }))
      },
      weekIncidents: {
        count: weekIncidents,
        incidents: incidents.filter(inc => {
          const incidentDate = new Date(inc.created_at);
          return incidentDate >= weekStart;
        }).map(inc => ({
          id: inc.id,
          status: inc.incident_status?.name,
          priority: inc.incident_priorities?.name,
          created_at: inc.created_at
        }))
      },
      transportSafety: {
        vehiclesRequiringAction: vehiclesRequiringAction,
        totalVehicles: vehicles.length,
        vehicles: vehicles.filter(vehicle => {
          return (
            vehicle.verification_status === 'pending' ||
            vehicle.verification_status === 'failed' ||
            vehicle.verification_status === null ||
            vehicle.status === 'inactive'
          );
        }).map(vehicle => ({
          id: vehicle.id,
          status: vehicle.status,
          verification_status: vehicle.verification_status
        }))
      }
    };

    console.log('Dashboard statistics calculated:', dashboardStats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: dashboardStats 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch dashboard statistics", 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
