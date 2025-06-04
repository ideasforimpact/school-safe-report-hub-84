
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId } = await req.json();

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    console.log('Fetching dashboard stats for client:', clientId);

    // Get current date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      openIncidentsResult,
      criticalIncidentsResult,
      todayIncidentsResult,
      weekIncidentsResult,
      totalAssessmentsResult,
      employeesResult,
      employeeDocumentsResult
    ] = await Promise.all([
      // Open Incidents
      supabaseClient
        .from('incidents')
        .select('id, incident_status!inner(name)')
        .eq('client_id', clientId)
        .in('incident_status.name', ['Open', 'New', 'In Progress']),

      // Critical Open Incidents
      supabaseClient
        .from('incidents')
        .select('id, incident_status!inner(name), incident_priorities!inner(name)')
        .eq('client_id', clientId)
        .in('incident_status.name', ['Open', 'New', 'In Progress'])
        .eq('incident_priorities.name', 'Critical'),

      // Today's Incidents
      supabaseClient
        .from('incidents')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', todayStart.toISOString()),

      // This Week's Incidents
      supabaseClient
        .from('incidents')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', weekStart.toISOString()),

      // Total Assessments
      supabaseClient
        .from('assessments')
        .select('id')
        .eq('client_id', clientId),

      // Active Employees
      supabaseClient
        .from('employees')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', true),

      // Employee Documents for verification status
      supabaseClient
        .from('employee_documents')
        .select('id, employee_id, verification_status, employees!inner(client_id)')
        .eq('employees.client_id', clientId)
    ]);

    // Check for errors
    if (openIncidentsResult.error) throw openIncidentsResult.error;
    if (criticalIncidentsResult.error) throw criticalIncidentsResult.error;
    if (todayIncidentsResult.error) throw todayIncidentsResult.error;
    if (weekIncidentsResult.error) throw weekIncidentsResult.error;
    if (totalAssessmentsResult.error) throw totalAssessmentsResult.error;
    if (employeesResult.error) throw employeesResult.error;
    if (employeeDocumentsResult.error) throw employeeDocumentsResult.error;

    // Process verification status
    const totalEmployees = employeesResult.data?.length || 0;
    const employeeDocuments = employeeDocumentsResult.data || [];
    
    // Group documents by employee
    const documentsByEmployee = employeeDocuments.reduce((acc: Record<string, any[]>, doc) => {
      if (!acc[doc.employee_id]) {
        acc[doc.employee_id] = [];
      }
      acc[doc.employee_id].push(doc);
      return acc;
    }, {});

    // Count employees with pending verification
    let pendingVerification = 0;
    const activeEmployees = employeesResult.data || [];
    
    activeEmployees.forEach(employee => {
      const employeeDocs = documentsByEmployee[employee.id] || [];
      
      if (employeeDocs.length === 0) {
        // No documents uploaded - pending
        pendingVerification++;
      } else {
        // Check if any documents are pending or failed verification
        const hasPendingDocs = employeeDocs.some(
          doc => !doc.verification_status || 
                 doc.verification_status === 'pending' || 
                 doc.verification_status === 'failed'
        );
        if (hasPendingDocs) {
          pendingVerification++;
        }
      }
    });

    const stats = {
      openIncidents: {
        count: openIncidentsResult.data?.length || 0,
        list: openIncidentsResult.data || []
      },
      verificationStatus: {
        pending: pendingVerification,
        total: totalEmployees,
        percentage: totalEmployees > 0 ? Math.round((pendingVerification / totalEmployees) * 100) : 0
      },
      totalAssessments: {
        count: totalAssessmentsResult.data?.length || 0,
        list: totalAssessmentsResult.data || []
      },
      openCriticalIncidents: {
        count: criticalIncidentsResult.data?.length || 0,
        list: criticalIncidentsResult.data || []
      },
      todayIncidents: {
        count: todayIncidentsResult.data?.length || 0,
        list: todayIncidentsResult.data || []
      },
      weekIncidents: {
        count: weekIncidentsResult.data?.length || 0,
        list: weekIncidentsResult.data || []
      }
    };

    console.log(`Successfully fetched dashboard stats for client ${clientId}:`, stats);

    return new Response(
      JSON.stringify({ 
        success: true,
        stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in dashboard-stats function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
