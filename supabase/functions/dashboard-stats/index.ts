
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { client_id, employee_id, is_super_admin } = await req.json()
    
    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('Fetching dashboard stats for client:', client_id, 'employee:', employee_id, 'is_super_admin:', is_super_admin)

    // Determine if we should apply employee filtering (default to super admin behavior if not specified)
    const shouldFilterByEmployee = is_super_admin === false && employee_id;

    // Get status IDs for "New" and "Open" incidents
    const { data: incidentStatuses } = await supabase
      .from('incident_status')
      .select('id, name')
      .in('name', ['New', 'Open'])

    const statusIds = incidentStatuses?.map(status => status.id) || []
    console.log('Status IDs found:', statusIds)

    // Get open incidents count with role-based filtering
    let openIncidentsQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .in('status_id', statusIds)

    if (shouldFilterByEmployee) {
      openIncidentsQuery = openIncidentsQuery.eq('created_by', employee_id)
    }

    const { data: openIncidents, error: openIncidentsError } = await openIncidentsQuery

    if (openIncidentsError) {
      console.error('Error fetching open incidents:', openIncidentsError)
    }

    // Get active assessments count with role-based filtering
    let activeAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'New')

    if (shouldFilterByEmployee) {
      activeAssessmentsQuery = activeAssessmentsQuery.eq('created_by', employee_id)
    }

    const { data: activeAssessments, error: activeAssessmentsError } = await activeAssessmentsQuery

    if (activeAssessmentsError) {
      console.error('Error fetching active assessments:', activeAssessmentsError)
    }

    // Get total employees for the client (always client-wide)
    const { data: totalEmployees, error: totalEmployeesError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    if (totalEmployeesError) {
      console.error('Error fetching total employees:', totalEmployeesError)
    }

    // Get employees with documents (always client-wide for team visibility)
    const { data: employeesWithDocs, error: employeesWithDocsError } = await supabase
      .from('employee_documents')
      .select('employee_id')
      .in('employee_id', await supabase
        .from('employees')
        .select('id')
        .eq('client_id', client_id)
        .then(res => res.data?.map(emp => emp.id) || [])
      )

    if (employeesWithDocsError) {
      console.error('Error fetching employees with documents:', employeesWithDocsError)
    }

    // Get unique employee IDs with documents
    const uniqueEmployeesWithDocs = new Set(employeesWithDocs?.map(doc => doc.employee_id) || [])

    // Get total vehicles with role-based filtering
    let totalVehiclesQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    if (shouldFilterByEmployee) {
      totalVehiclesQuery = totalVehiclesQuery.eq('employee_id', employee_id)
    }

    const { data: totalVehicles, error: totalVehiclesError } = await totalVehiclesQuery

    if (totalVehiclesError) {
      console.error('Error fetching total vehicles:', totalVehiclesError)
    }

    // Get vehicles with documents with role-based filtering
    let vehicleIdsQuery = supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', client_id)

    if (shouldFilterByEmployee) {
      vehicleIdsQuery = vehicleIdsQuery.eq('employee_id', employee_id)
    }

    const vehicleIds = await vehicleIdsQuery.then(res => res.data?.map(vehicle => vehicle.id) || [])

    const { data: vehiclesWithDocs, error: vehiclesWithDocsError } = await supabase
      .from('vehicle_documents')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)

    if (vehiclesWithDocsError) {
      console.error('Error fetching vehicles with documents:', vehiclesWithDocsError)
    }

    // Get unique vehicle IDs with documents
    const uniqueVehiclesWithDocs = new Set(vehiclesWithDocs?.map(doc => doc.vehicle_id) || [])

    // Get incidents from last month with role-based filtering
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    let incidentsLastMonthQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', oneMonthAgo.toISOString())

    if (shouldFilterByEmployee) {
      incidentsLastMonthQuery = incidentsLastMonthQuery.eq('created_by', employee_id)
    }

    const { data: incidentsLastMonth, error: incidentsLastMonthError } = await incidentsLastMonthQuery

    if (incidentsLastMonthError) {
      console.error('Error fetching incidents last month:', incidentsLastMonthError)
    }

    // Get incidents from last 6 months with role-based filtering
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let incidentsLast6MonthsQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', sixMonthsAgo.toISOString())

    if (shouldFilterByEmployee) {
      incidentsLast6MonthsQuery = incidentsLast6MonthsQuery.eq('created_by', employee_id)
    }

    const { data: incidentsLast6Months, error: incidentsLast6MonthsError } = await incidentsLast6MonthsQuery

    if (incidentsLast6MonthsError) {
      console.error('Error fetching incidents last 6 months:', incidentsLast6MonthsError)
    }

    // Get monthly incidents data for chart with role-based filtering
    const monthlyIncidentsData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' })

      // Get all incidents for this month with role-based filtering
      let monthIncidentsQuery = supabase
        .from('incidents')
        .select('status_id')
        .eq('client_id', client_id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      if (shouldFilterByEmployee) {
        monthIncidentsQuery = monthIncidentsQuery.eq('created_by', employee_id)
      }

      const { data: monthIncidents } = await monthIncidentsQuery

      // Get closed status ID
      const { data: closedStatus } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', 'Closed')
        .single()

      const closedStatusId = closedStatus?.id

      const openCount = monthIncidents?.filter(incident => 
        statusIds.includes(incident.status_id)
      ).length || 0

      const closedCount = monthIncidents?.filter(incident => 
        incident.status_id === closedStatusId
      ).length || 0

      monthlyIncidentsData.push({
        month: monthName,
        open: openCount,
        closed: closedCount,
        total: openCount + closedCount
      })
    }

    const response = {
      openIncidents: openIncidents?.length || 0,
      activeAssessments: activeAssessments?.length || 0,
      totalEmployees: totalEmployees?.length || 0,
      employeesVerified: uniqueEmployeesWithDocs.size,
      totalVehicles: totalVehicles?.length || 0,
      vehiclesWithDocuments: uniqueVehiclesWithDocs.size,
      incidentsLastMonth: incidentsLastMonth?.length || 0,
      incidentsLast6Months: incidentsLast6Months?.length || 0,
      monthlyIncidentsData
    }

    console.log('Dashboard stats response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in dashboard-stats function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
