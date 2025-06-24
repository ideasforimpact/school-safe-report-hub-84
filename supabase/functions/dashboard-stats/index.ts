
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

    // Get status IDs for "New" and "Open" incidents
    const { data: incidentStatuses } = await supabase
      .from('incident_status')
      .select('id, name')
      .in('name', ['New', 'Open'])

    const statusIds = incidentStatuses?.map(status => status.id) || []
    console.log('Status IDs found:', statusIds)

    // Build incident filters based on employee permissions
    let incidentQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    // For regular employees, filter by created_by only
    if (!is_super_admin && employee_id) {
      incidentQuery = incidentQuery.eq('created_by', employee_id)
    }

    // Get open incidents count (New and Open status)
    const { data: openIncidents, error: openIncidentsError } = await incidentQuery
      .in('status_id', statusIds)

    if (openIncidentsError) {
      console.error('Error fetching open incidents:', openIncidentsError)
    }

    // Build assessment filters based on employee permissions
    let assessmentQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'New')

    // For regular employees, filter by created_by only
    if (!is_super_admin && employee_id) {
      assessmentQuery = assessmentQuery.eq('created_by', employee_id)
    }

    // Get active assessments count (only New status)
    const { data: activeAssessments, error: activeAssessmentsError } = await assessmentQuery

    if (activeAssessmentsError) {
      console.error('Error fetching active assessments:', activeAssessmentsError)
    }

    // Get total employees for the client
    const { data: totalEmployees, error: totalEmployeesError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    if (totalEmployeesError) {
      console.error('Error fetching total employees:', totalEmployeesError)
    }

    // Get employees with documents (verified employees)
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

    // Build vehicle filters based on employee permissions
    let vehicleQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    // For regular employees, filter by employee_id
    if (!is_super_admin && employee_id) {
      vehicleQuery = vehicleQuery.eq('employee_id', employee_id)
    }

    // Get total vehicles for the client/employee
    const { data: totalVehicles, error: totalVehiclesError } = await vehicleQuery

    if (totalVehiclesError) {
      console.error('Error fetching total vehicles:', totalVehiclesError)
    }

    // Get vehicles with documents
    const vehicleIds = await supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', client_id)
      .then(res => {
        let ids = res.data?.map(vehicle => vehicle.id) || []
        // For regular employees, filter vehicle IDs by employee_id
        if (!is_super_admin && employee_id) {
          return supabase
            .from('vehicles')
            .select('id')
            .eq('client_id', client_id)
            .eq('employee_id', employee_id)
            .then(empRes => empRes.data?.map(vehicle => vehicle.id) || [])
        }
        return ids
      })

    const { data: vehiclesWithDocs, error: vehiclesWithDocsError } = await supabase
      .from('vehicle_documents')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)

    if (vehiclesWithDocsError) {
      console.error('Error fetching vehicles with documents:', vehiclesWithDocsError)
    }

    // Get unique vehicle IDs with documents
    const uniqueVehiclesWithDocs = new Set(vehiclesWithDocs?.map(doc => doc.vehicle_id) || [])

    // Get incidents from last month
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    let lastMonthIncidentQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', oneMonthAgo.toISOString())

    // For regular employees, filter by created_by only
    if (!is_super_admin && employee_id) {
      lastMonthIncidentQuery = lastMonthIncidentQuery.eq('created_by', employee_id)
    }

    const { data: incidentsLastMonth, error: incidentsLastMonthError } = await lastMonthIncidentQuery

    if (incidentsLastMonthError) {
      console.error('Error fetching incidents last month:', incidentsLastMonthError)
    }

    // Get incidents from last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let last6MonthsIncidentQuery = supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .gte('created_at', sixMonthsAgo.toISOString())

    // For regular employees, filter by created_by only
    if (!is_super_admin && employee_id) {
      last6MonthsIncidentQuery = last6MonthsIncidentQuery.eq('created_by', employee_id)
    }

    const { data: incidentsLast6Months, error: incidentsLast6MonthsError } = await last6MonthsIncidentQuery

    if (incidentsLast6MonthsError) {
      console.error('Error fetching incidents last 6 months:', incidentsLast6MonthsError)
    }

    // Get monthly incidents data for chart
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

      // Get all incidents for this month
      let monthQuery = supabase
        .from('incidents')
        .select('status_id')
        .eq('client_id', client_id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      // For regular employees, filter by created_by only
      if (!is_super_admin && employee_id) {
        monthQuery = monthQuery.eq('created_by', employee_id)
      }

      const { data: monthIncidents } = await monthQuery

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
