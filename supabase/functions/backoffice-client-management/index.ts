import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create a Supabase client with service role for bypassing RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    console.log('Backoffice client management request:', { action, payload })

    switch (action) {
      case 'fetchAllClients':
        return await fetchAllClients()
      case 'fetchEmployeesByClient':
        return await fetchEmployeesByClient(payload.clientId)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Error in backoffice client management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function fetchAllClients() {
  console.log('🔍 Fetching all clients with service role...')
  
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, active')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching clients:', error)
    throw error
  }

  console.log('✅ Successfully fetched clients:', data?.length || 0)
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function fetchEmployeesByClient(clientId: string) {
  if (!clientId) {
    throw new Error('Client ID is required')
  }

  console.log('🔍 Fetching employees for client:', clientId)

  // Fetch employees
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, employee_id, first_name, last_name, email, department, employee_type, client_id')
    .eq('client_id', clientId)
    .eq('status', true)
    .order('first_name')

  if (employeesError) {
    console.error('Error fetching employees:', employeesError)
    throw employeesError
  }

  // Fetch document summaries
  const employeeIds = employees?.map(emp => emp.id) || []
  let documentSummaries: Record<string, any> = {}
  
  if (employeeIds.length > 0) {
    const { data: documents, error: documentsError } = await supabase
      .from('employee_documents')
      .select('employee_id, verification_status')
      .in('employee_id', employeeIds)

    if (!documentsError && documents) {
      documentSummaries = documents.reduce((acc, doc) => {
        if (!acc[doc.employee_id]) {
          acc[doc.employee_id] = { total: 0, verified: 0, pending: 0, failed: 0 }
        }
        
        acc[doc.employee_id].total++
        
        switch (doc.verification_status) {
          case 'verified':
          case 'completed':
            acc[doc.employee_id].verified++
            break
          case 'pending':
          case 'in-progress':
            acc[doc.employee_id].pending++
            break
          case 'failed':
          case 'rejected':
            acc[doc.employee_id].failed++
            break
        }
        
        return acc
      }, {} as Record<string, any>)
    }
  }

  // Map employees with document summaries
  const result = (employees || []).map(emp => ({
    id: emp.id,
    employeeId: emp.employee_id || '',
    name: `${emp.first_name} ${emp.last_name}`,
    email: emp.email || '',
    department: emp.department || '',
    position: emp.employee_type || '',
    clientId: emp.client_id,
    documentsSummary: documentSummaries[emp.id] || { total: 0, verified: 0, pending: 0, failed: 0 }
  }))

  console.log('✅ Successfully fetched employees:', result.length)
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}