
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

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

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      client_id,
      url.pathname
    );
    
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching dashboard stats for client:', client_id, 'employee:', employee_id, 'is_super_admin:', is_super_admin)

    // Determine if we should apply employee filtering (default to super admin behavior if not specified)
    const shouldFilterByEmployee = is_super_admin === false && employee_id;

    // Get all incident statuses for debugging
    const { data: allIncidentStatuses } = await supabase
      .from('incident_status')
      .select('id, name')
    
    console.log('All incident statuses:', allIncidentStatuses)

    // Get status ID for "Open" incidents only
    const { data: openStatus } = await supabase
      .from('incident_status')
      .select('id, name')
      .eq('name', 'Open')
      .single()

    const openStatusId = openStatus?.id
    console.log('Open status ID found:', openStatusId)

    // Get open incidents count with role-based filtering
    let openIncidentsQuery = supabase
      .from('incidents')
      .select(`
        id, 
        status_id, 
        people_involved, 
        category_id,
        incident_categories!inner(name)
      `, { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status_id', openStatusId)
      // Only include incidents that have been open for more than 7 days
      // .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (shouldFilterByEmployee) {
      openIncidentsQuery = openIncidentsQuery.eq('created_by', employee_id)
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let openIncidentOlder7daysQuery = supabase
      .from('incidents')
      .select(`
        id, 
        status_id, 
        people_involved, 
        category_id,
        incident_categories!inner(name)
      `, { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status_id', openStatusId)
      // Only include incidents that have been open for more than 7 days
      // .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (shouldFilterByEmployee) {
        openIncidentOlder7daysQuery = openIncidentOlder7daysQuery.eq('created_by', employee_id)
      }


    openIncidentOlder7daysQuery = openIncidentOlder7daysQuery.lt('date', sevenDaysAgo)

    const { data: openIncidentOlder7days, error: openIncidentOlder7daysError } = await openIncidentOlder7daysQuery

    if(openIncidentOlder7daysError){
      console.log('Error fetching open incidents older than 7 days:', openIncidentOlder7daysError); 
    }

    const { data: openIncidents, error: openIncidentsError } = await openIncidentsQuery

    console.log("openIncidents",[openIncidentOlder7days.length,openIncidents.length]);
    

    if (openIncidentsError) {
      console.error('Error fetching open incidents:', openIncidentsError)
    }

    console.log('Open incidents found:', openIncidents)

    // Debug: Let's also check ALL incidents for this client to see what statuses exist
    const { data: allClientIncidents } = await supabase
      .from('incidents')
      .select('id, status_id, category')
      .eq('client_id', client_id)
    
    console.log('All incidents for client:', allClientIncidents)
    console.log('Status IDs in incidents:', allClientIncidents?.map(inc => inc.status_id))

    // Calculate number of students involved in open incidents by category
    let studentsInvolvedCount = 0
    const categoryCounts: { [key: string]: number } = {}
    
    if (openIncidents && openIncidents.length > 0) {
      openIncidents.forEach(incident => {
        if (incident.people_involved && Array.isArray(incident.people_involved)) {
          let incidentStudentCount = 0
          incident.people_involved.forEach(person => {
            if (person.role === 'Student') {
              studentsInvolvedCount++
              incidentStudentCount++
            }
          })
          
          // If this incident has students involved, count it for the category
          if (incidentStudentCount > 0 && incident.incident_categories?.name) {
            categoryCounts[incident.incident_categories.name] = (categoryCounts[incident.incident_categories.name] || 0) + incidentStudentCount
          }
        }
      })
    }

    // Get top 3 categories by student count
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))

    console.log('Students involved in open incidents:', studentsInvolvedCount)
    console.log('Top categories by student count:', topCategories)

    // Get active assessments count with role-based filtering (exclude Completed)
    let activeAssessmentsQuery = supabase
      .from('assessments')
      .select('id, target_completion_date, status')
      .eq('client_id', client_id)
      .neq('status', 'Completed')

    if (shouldFilterByEmployee) {
      activeAssessmentsQuery = activeAssessmentsQuery.eq('created_by', employee_id)
    }

    const { data: activeAssessments, error: activeAssessmentsError } = await activeAssessmentsQuery

    if (activeAssessmentsError) {
      console.error('Error fetching active assessments:', activeAssessmentsError)
    }

    // Get breakdown of active assessment statuses
    const newAssessmentsCount = activeAssessments?.filter(assessment => assessment.status === 'New').length || 0
    const draftAssessmentsCount = activeAssessments?.filter(assessment => assessment.status === 'Draft').length || 0
    const submittedAssessmentsCount = activeAssessments?.filter(assessment => assessment.status === 'Submitted').length || 0

    console.log('Assessment stats:', {
      totalActive: activeAssessments?.length || 0,
      newCount: newAssessmentsCount,
      draftCount: draftAssessmentsCount,
      submittedCount: submittedAssessmentsCount
    })

    // Get form submissions for last 30, 60, 90 days (unacknowledged only)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get all unacknowledged form submissions for the client
    const { data: allUnacknowledgedSubmissions, error: allSubmissionsError } = await supabase
      .from('form_submissions')
      .select('id, created_at')
      .eq('client_id', client_id)
      .is('acknowledged_at', null)

    if (allSubmissionsError) {
      console.error('Error fetching all unacknowledged submissions:', allSubmissionsError)
    }

    // Filter submissions by time windows
    const submissions30Days = allUnacknowledgedSubmissions?.filter(sub => 
      new Date(sub.created_at) >= thirtyDaysAgo
    ) || []

    const submissions60Days = allUnacknowledgedSubmissions?.filter(sub => 
      new Date(sub.created_at) >= sixtyDaysAgo
    ) || []

    const submissions90Days = allUnacknowledgedSubmissions?.filter(sub => 
      new Date(sub.created_at) >= ninetyDaysAgo
    ) || []

    console.log('Form submissions stats (unacknowledged):', {
      totalUnacknowledged: allUnacknowledgedSubmissions?.length || 0,
      submissions30Days: submissions30Days.length,
      submissions60Days: submissions60Days.length,
      submissions90Days: submissions90Days.length
    })

    // Get vehicle verification stats (only active vehicles)
    const { data: allVehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, verification_data')
      .eq('client_id', client_id)
      .eq('active', true)

    if (vehiclesError) {
      console.error('Error fetching vehicles for verification stats:', vehiclesError)
    }

    // Calculate verification stats
    let vehiclesToBeVerified = 0
    let vehiclesFailedVerification = 0
    let vehiclesVerified = 0

    allVehicles?.forEach(vehicle => {
      console.log(`Vehicle ${vehicle.id}: verification_data exists: ${!!vehicle.verification_data}, length: ${vehicle.verification_data?.length || 0}`)
      
      if (!vehicle.verification_data || vehicle.verification_data.length === 0) {
        // No verification data - to be verified
        vehiclesToBeVerified++
        console.log(`Vehicle ${vehicle.id}: No verification data - to be verified`)
      } else {
        // Has verification data - check if any documents are expired/missing
        const verificationData = vehicle.verification_data
        
        // Find verification_log entry
        const logEntry = verificationData.find((item: any) => item.field === 'verification_log')
        if (!logEntry || !logEntry.value) {
          vehiclesToBeVerified++
          console.log(`Vehicle ${vehicle.id}: No verification log - to be verified`)
          return
        }

        // Get latest verification log
        const timestamps = Object.keys(logEntry.value)
        if (timestamps.length === 0) {
          vehiclesToBeVerified++
          console.log(`Vehicle ${vehicle.id}: No timestamps in log - to be verified`)
          return
        }

        timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        const latestLog = logEntry.value[timestamps[0]]

        // Check document statuses
        const fitnessField = latestLog.find((item: any) => item.field === 'fit_up_to')
        const insuranceField = latestLog.find((item: any) => item.field === 'insurance_upto')
        const pollutionField = latestLog.find((item: any) => item.field === 'pucc_upto')

        console.log(`Vehicle ${vehicle.id}: fitness=${fitnessField?.value}, insurance=${insuranceField?.value}, pollution=${pollutionField?.value}`)

        const currentDate = new Date()
        let hasExpiredOrMissing = false

        // Check if any document is expired or missing
        ;[fitnessField, insuranceField, pollutionField].forEach(field => {
          if (!field || !field.value) {
            hasExpiredOrMissing = true
            console.log(`Vehicle ${vehicle.id}: Missing field or value`)
            return
          }

          try {
            const expiryDate = new Date(field.value)
            if (isNaN(expiryDate.getTime()) || expiryDate < currentDate) {
              hasExpiredOrMissing = true
              console.log(`Vehicle ${vehicle.id}: Expired or invalid date: ${field.value}`)
            }
          } catch (e) {
            hasExpiredOrMissing = true
            console.log(`Vehicle ${vehicle.id}: Error parsing date: ${field.value}`)
          }
        })

        if (hasExpiredOrMissing) {
          vehiclesFailedVerification++
          console.log(`Vehicle ${vehicle.id}: Has expired/missing documents - failed verification`)
        } else {
          // All documents are valid - vehicle is verified
          vehiclesVerified++
          console.log(`Vehicle ${vehicle.id}: All documents valid - verified`)
        }
      }
    })

    console.log('Vehicle verification stats:', {
      totalVehicles: allVehicles?.length || 0,
      vehiclesToBeVerified,
      vehiclesFailedVerification,
      vehiclesVerified
    })

    // Get total employees for the client (always client-wide)
    const { data: totalEmployees, error: totalEmployeesError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    if (totalEmployeesError) {
      console.error('Error fetching total employees:', totalEmployeesError)
    }

    // Get total employees for this client
    const employeeIds = await supabase
        .from('employees')
        .select('id')
        .eq('client_id', client_id)
        .eq('status',true)
        .then(res => res.data?.map(emp => emp.id) || [])

    // Fetch document status IDs for completed, governance, and rejected
    const { data: completedStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'completed')
      .single()

    const { data: governanceStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .single()

    const { data: rejectedStatus } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'rejected')
      .single()

    // Get all employee documents to apply the same logic as employee-verification status column
    const { data: allEmployeeDocs, error: allDocsError } = await supabase
      .from('employee_documents')
      .select('employee_id, verification_status')
      .in('employee_id', employeeIds)
      .eq('is_delete', 0)

    if (allDocsError) {
      console.error('Error fetching all employee documents:', allDocsError)
    }

    // Group documents by employee and apply the same priority logic as employee-verification
    const employeeStatusMap = new Map()
    
    // Initialize all employees as 'no-documents'
    employeeIds.forEach(id => {
      employeeStatusMap.set(id, 'no-documents')
    })

    // Group documents by employee
    const employeeDocsMap = new Map()
    allEmployeeDocs?.forEach(doc => {
      if (!employeeDocsMap.has(doc.employee_id)) {
        employeeDocsMap.set(doc.employee_id, [])
    }
      employeeDocsMap.get(doc.employee_id).push(doc)
    })

    // Apply the same priority logic as employee-verification status column
    employeeDocsMap.forEach((docs, employeeId) => {
      const verified = docs.filter(doc => doc.verification_status === 'verified' || doc.verification_status === 'completed')
      const failed = docs.filter(doc => doc.verification_status === 'failed')
      const pending = docs.filter(doc => doc.verification_status === 'pending' || doc.verification_status === 'in-progress')
      
      // Priority: Failed > Pending > Verified
      if (failed.length > 0) {
        employeeStatusMap.set(employeeId, 'failed')
      } else if (pending.length > 0) {
        employeeStatusMap.set(employeeId, 'pending')
      } else if (verified.length > 0) {
        employeeStatusMap.set(employeeId, 'verified')
      }
    })

    // Count employees by status
    const employeesVerified = Array.from(employeeStatusMap.entries()).filter(([_, status]) => status === 'verified').length
    const employeesFailed = Array.from(employeeStatusMap.entries()).filter(([_, status]) => status === 'failed').length
    const employeesPending = Array.from(employeeStatusMap.entries()).filter(([_, status]) => status === 'pending').length
    const employeesNoDocuments = Array.from(employeeStatusMap.entries()).filter(([_, status]) => status === 'no-documents').length

    // For dashboard purposes:
    // - "Employees to be verified" = pending + no-documents (those who haven't failed and aren't verified)
    // - "Employees failed verification" = failed
    // - "Total Safe Employees" = total employees
    const employeesToBeVerified = employeesPending + employeesNoDocuments                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

    console.log('Employee verification stats:', {
      totalEmployees: employeeIds.length,
      completedStatusId: completedStatus?.id,
      governanceStatusId: governanceStatus?.id,
      rejectedStatusId: rejectedStatus?.id,
      allDocsCount: allEmployeeDocs?.length || 0,
      employeesVerified: employeesVerified,
      employeesFailed: employeesFailed,
      employeesPending: employeesPending,
      employeesNoDocuments: employeesNoDocuments,
      employeesToBeVerified: employeesToBeVerified
    })

    // Get total vehicles with role-based filtering (only active vehicles)
    let totalVehiclesQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('active', true)

    if (shouldFilterByEmployee) {
      totalVehiclesQuery = totalVehiclesQuery.eq('employee_id', employee_id)
    }

    const { data: totalVehicles, error: totalVehiclesError } = await totalVehiclesQuery

    if (totalVehiclesError) {
      console.error('Error fetching total vehicles:', totalVehiclesError)
    }

    // Get vehicles with documents with role-based filtering (only active vehicles)
    let vehicleIdsQuery = supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', client_id)
      .eq('active', true)

    if (shouldFilterByEmployee) {
      vehicleIdsQuery = vehicleIdsQuery.eq('employee_id', employee_id)
    }

    const vehicleIds = await vehicleIdsQuery.then(res => res.data?.map(vehicle => vehicle.id) || [])
    let totalPendingChallanAmount = 0;

    if (vehicleIds.length > 0) {
      const { data: challans, error: challanError } = await supabase
        .from('vehicle_challans')
        .select('latest_challan_data')
        .in('vehicle_id', vehicleIds);

      if (challanError) {
        console.error('Error fetching vehicle challans:', challanError);
      }

      challans?.forEach(row => {
        const challanList =
          row.latest_challan_data?.challans ||
          row.latest_challan_data?.data?.challan_details?.challans ||
          [];

        challanList.forEach((c: any) => {
          if (c.challan_status === 'Pending') {
            const amount = Number(c.amount || 0);

            if (!isNaN(amount)) {
              totalPendingChallanAmount += amount;
            }
          }
        });
      });
    }
    const { data: vehiclesWithDocs, error: vehiclesWithDocsError } = await supabase
      .from('vehicle_documents')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)

    if (vehiclesWithDocsError) {
      console.error('Error fetching vehicles with documents:', vehiclesWithDocsError)
    }

    // Get unique vehicle IDs with documents
    const uniqueVehiclesWithDocs = new Set(vehiclesWithDocs?.map(doc => doc.vehicle_id) || [])

    // Get active vehicles count with role-based filtering (only active vehicles)
    let activeVehiclesQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'active')
      .eq('active', true)

    if (shouldFilterByEmployee) {
      activeVehiclesQuery = activeVehiclesQuery.eq('employee_id', employee_id)
    }

    const { data: activeVehicles, error: activeVehiclesError } = await activeVehiclesQuery

    if (activeVehiclesError) {
      console.error('Error fetching active vehicles:', activeVehiclesError)
    }

    // Get maintenance vehicles count with role-based filtering (only active vehicles)
    let maintenanceVehiclesQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'maintenance')
      .eq('active', true)

    if (shouldFilterByEmployee) {
      maintenanceVehiclesQuery = maintenanceVehiclesQuery.eq('employee_id', employee_id)
    }

    const { data: maintenanceVehicles, error: maintenanceVehiclesError } = await maintenanceVehiclesQuery

    if (maintenanceVehiclesError) {
      console.error('Error fetching maintenance vehicles:', maintenanceVehiclesError)
    }

    // Get inactive vehicles count with role-based filtering
    let inactiveVehiclesQuery = supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'inactive')

    if (shouldFilterByEmployee) {
      inactiveVehiclesQuery = inactiveVehiclesQuery.eq('employee_id', employee_id)
    }

    const { data: inactiveVehicles, error: inactiveVehiclesError } = await inactiveVehiclesQuery

    if (inactiveVehiclesError) {
      console.error('Error fetching inactive vehicles:', inactiveVehiclesError)
    }

    // Get assessment status counts with role-based filtering
    let totalAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)

    if (shouldFilterByEmployee) {
      totalAssessmentsQuery = totalAssessmentsQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`)
    }

    const { data: totalAssessments, error: totalAssessmentsError } = await totalAssessmentsQuery

    if (totalAssessmentsError) {
      console.error('Error fetching total assessments:', totalAssessmentsError)
    }

    let newAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'New')

    if (shouldFilterByEmployee) {
      newAssessmentsQuery = newAssessmentsQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`)
    }

    const { data: newAssessments, error: newAssessmentsError } = await newAssessmentsQuery

    if (newAssessmentsError) {
      console.error('Error fetching new assessments:', newAssessmentsError)
    }

    let completedAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'Completed')

    if (shouldFilterByEmployee) {
      completedAssessmentsQuery = completedAssessmentsQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`)
    }

    const { data: completedAssessments, error: completedAssessmentsError } = await completedAssessmentsQuery

    if (completedAssessmentsError) {
      console.error('Error fetching completed assessments:', completedAssessmentsError)
    }

    let draftAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status', 'Draft')

    if (shouldFilterByEmployee) {
      draftAssessmentsQuery = draftAssessmentsQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`)
    }

    const { data: draftAssessments, error: draftAssessmentsError } = await draftAssessmentsQuery

    if (draftAssessmentsError) {
      console.error('Error fetching draft assessments:', draftAssessmentsError)
    }

    // Get overdue assessments count with role-based filtering
    const currentDate = new Date().toISOString().split('T')[0] // Get current date in YYYY-MM-DD format
    
    let overdueAssessmentsQuery = supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', client_id)
      .neq('status', 'Completed')
      .lt('target_completion_date', currentDate)

    if (shouldFilterByEmployee) {
      overdueAssessmentsQuery = overdueAssessmentsQuery.or(`created_by.eq.${employee_id},assigned_to.eq.${employee_id}`)
    }

    const { data: overdueAssessments, error: overdueAssessmentsError } = await overdueAssessmentsQuery

    if (overdueAssessmentsError) {
      console.error('Error fetching overdue assessments:', overdueAssessmentsError)
    }

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

    // Get closed incidents count with role-based filtering
    const { data: closedStatus } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Closed')
      .single()

    const closedStatusId = closedStatus?.id
    console.log('Closed status ID found:', closedStatusId)

    let closedIncidentsQuery = supabase
      .from('incidents')
      .select('id, status_id', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('status_id', closedStatusId)

    if (shouldFilterByEmployee) {
      closedIncidentsQuery = closedIncidentsQuery.eq('created_by', employee_id)
    }

    const { data: closedIncidents, error: closedIncidentsError } = await closedIncidentsQuery

    if (closedIncidentsError) {
      console.error('Error fetching closed incidents:', closedIncidentsError)
    }

    console.log('Closed incidents found:', closedIncidents)

    // Get reopened incidents count using the reopen column
    let reopenedIncidentsQuery = supabase
      .from('incidents')
      .select('id, reopen', { count: 'exact' })
      .eq('client_id', client_id)
      .eq('reopen', 1)

    if (shouldFilterByEmployee) {
      reopenedIncidentsQuery = reopenedIncidentsQuery.eq('created_by', employee_id)
    }

    const { data: reopenedIncidents, error: reopenedIncidentsError } = await reopenedIncidentsQuery

    if (reopenedIncidentsError) {
      console.error('Error fetching reopened incidents:', reopenedIncidentsError)
    }

    console.log('Reopened incidents found:', reopenedIncidents)

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
        incident.status_id === openStatusId
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
      openIncidentOlder7days:openIncidentOlder7days?.length || 0,
      studentsInvolved: studentsInvolvedCount,
      studentsInvolvedByCategory: topCategories,
      activeAssessments: activeAssessments?.length || 0,
      newAssessments: newAssessmentsCount,
      draftAssessments: draftAssessmentsCount,
      submittedAssessments: submittedAssessmentsCount,
      totalCustomForms: 0, // Removed custom forms count as we're now using direct client_id filtering
      totalUnacknowledged: allUnacknowledgedSubmissions?.length || 0,
      formSubmissions30Days: submissions30Days?.length || 0,
      formSubmissions60Days: submissions60Days?.length || 0,
      formSubmissions90Days: submissions90Days?.length || 0,
      totalVehicles: allVehicles?.length || 0,
      vehiclesToBeVerified,
      vehiclesFailedVerification,
      vehiclesVerified,
      totalEmployees: employeeIds.length,
      employeesVerified: employeesVerified, 
      employeesFailed: employeesFailed,

      vehiclesWithDocuments: uniqueVehiclesWithDocs.size,
      activeVehicles: activeVehicles?.length || 0,
      maintenanceVehicles: maintenanceVehicles?.length || 0,
      inactiveVehicles: inactiveVehicles?.length || 0,
      incidentsLastMonth: incidentsLastMonth?.length || 0,
      incidentsLast6Months: incidentsLast6Months?.length || 0,
      totalAssessments: totalAssessments?.length || 0,
      completedAssessments: completedAssessments?.length || 0,
      closedIncidents: closedIncidents?.length || 0,
      reopenedIncidents: reopenedIncidents?.length || 0,
      overdueAssessments: overdueAssessments?.length || 0,
      monthlyIncidentsData
    }

    // Check if data exists for each table based on client_id
    const { data: incidentRecords, error: incidentRecordsError } = await supabase
      .from('incidents')
      .select('id')
      .eq('client_id', client_id)
      .limit(1)

    const { data: assessmentRecords, error: assessmentRecordsError } = await supabase
      .from('assessments')
      .select('id')
      .eq('client_id', client_id)
      .limit(1)

    const { data: vehicleRecords, error: vehicleRecordsError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', client_id)
      .eq('active', true)
      .limit(1)

    const { data: employeeRecords, error: employeeRecordsError } = await supabase
      .from('employees')
      .select('id')
      .eq('client_id', client_id)
      .limit(1)

    const { data: formSubmissionRecords, error: formSubmissionRecordsError } = await supabase
      .from('form_submissions')
      .select('id')
      .eq('client_id', client_id)
      .limit(1)

    // Boolean existence checks
    const IncidentRecordsExist = !incidentRecordsError && incidentRecords && incidentRecords.length > 0
    const AssessmentRecordsExist = !assessmentRecordsError && assessmentRecords && assessmentRecords.length > 0
    const VehicleRecordsExist = !vehicleRecordsError && vehicleRecords && vehicleRecords.length > 0
    const EmployeeRecordsExist = !employeeRecordsError && employeeRecords && employeeRecords.length > 0
    const FormSubmissionRecordsExist = !formSubmissionRecordsError && formSubmissionRecords && formSubmissionRecords.length > 0

    console.log('Data existence checks:', {
      IncidentRecordsExist,
      AssessmentRecordsExist,
      VehicleRecordsExist,
      EmployeeRecordsExist,
      FormSubmissionRecordsExist
    })

    const dashboardResponse = {
      openIncidents: openIncidents?.length || 0,
      openIncidentOlder7days:openIncidentOlder7days?.length || 0,
      studentsInvolved: studentsInvolvedCount,
      studentsInvolvedByCategory: topCategories,
      activeAssessments: activeAssessments?.length || 0,
      newAssessments: newAssessmentsCount,
      draftAssessments: draftAssessmentsCount,
      submittedAssessments: submittedAssessmentsCount,
      totalCustomForms: 0, // Removed custom forms count as we're now using direct client_id filtering
      totalUnacknowledged: allUnacknowledgedSubmissions?.length || 0,
      formSubmissions30Days: submissions30Days?.length || 0,
      formSubmissions60Days: submissions60Days?.length || 0,
      formSubmissions90Days: submissions90Days?.length || 0,
      totalVehicles: allVehicles?.length || 0,
      vehiclesToBeVerified,
      vehiclesFailedVerification,
      totalPendingChallanAmount,
      vehiclesVerified,
      totalEmployees: employeeIds.length,
      employeesVerified: employeesVerified, 
      employeesFailed: employeesFailed,

      vehiclesWithDocuments: uniqueVehiclesWithDocs.size,
      activeVehicles: activeVehicles?.length || 0,
      maintenanceVehicles: maintenanceVehicles?.length || 0,
      inactiveVehicles: inactiveVehicles?.length || 0,
      incidentsLastMonth: incidentsLastMonth?.length || 0,
      incidentsLast6Months: incidentsLast6Months?.length || 0,
      totalAssessments: totalAssessments?.length || 0,
      completedAssessments: completedAssessments?.length || 0,
      closedIncidents: closedIncidents?.length || 0,
      reopenedIncidents: reopenedIncidents?.length || 0,
      overdueAssessments: overdueAssessments?.length || 0,
      monthlyIncidentsData,
      // Add existence checks
      IncidentRecordsExist,
      AssessmentRecordsExist,
      VehicleRecordsExist,
      EmployeeRecordsExist,
      FormSubmissionRecordsExist
    }

    console.log('Dashboard stats response:', dashboardResponse)

    return new Response(
      JSON.stringify(dashboardResponse),
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
