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
      case 'fetch-clients':
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
  console.log('🔍 Fetching active clients with service role...')
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching clients:', error)
    throw error
  }

  console.log('✅ Successfully fetched active clients:', data?.length || 0)
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

  console.log('🔍 Fetching employees with manual documents for client:', clientId)

  // First, get the manual document type ID
  const { data: manualDocType, error: docTypeError } = await supabase
    .from('employee_document_type')
    .select('id')
    .eq('name', 'manual')
    .single()

  if (docTypeError) {
    console.error('Error fetching manual document type:', docTypeError)
    throw docTypeError
  }

  if (!manualDocType) {
    console.log('⚠️ Manual document type not found, returning empty result')
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Fetch all manual documents for this client
  const { data: manualDocuments, error: documentsError } = await supabase
    .from('employee_documents')
    .select(`
      employee_id,
      verification_status,
      document_type_id
    `)
    .eq('document_type_id', manualDocType.id)

  if (documentsError) {
    console.error('Error fetching manual documents:', documentsError)
    throw documentsError
  }

  console.log('📊 Found manual documents:', manualDocuments?.length || 0)

  // Get unique employee IDs from manual documents
  const employeeIdsWithManualDocs = [...new Set(manualDocuments?.map(doc => doc.employee_id) || [])]
  console.log('👥 Employee IDs with manual docs:', employeeIdsWithManualDocs)

  if (employeeIdsWithManualDocs.length === 0) {
    console.log('⚠️ No employees found with manual documents')
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Fetch employees who have manual documents
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, employee_id, first_name, last_name, email, department, employee_type, client_id')
    .in('id', employeeIdsWithManualDocs)
    .eq('client_id', clientId)
    .eq('status', true)
    .order('first_name')

  if (employeesError) {
    console.error('Error fetching employees:', employeesError)
    throw employeesError
  }

  console.log('👥 Found employees with manual docs:', employees?.length || 0)

  // Group manual documents by employee and create summaries
  const employeeMap = new Map()
  
  // Initialize employee map with employee data
  employees?.forEach(emp => {
    employeeMap.set(emp.id, {
      id: emp.id,
      employeeId: emp.employee_id || '',
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email || '',
      department: emp.department || '',
      position: emp.employee_type || '',
      clientId: emp.client_id,
      documentsSummary: { total: 0, verified: 0, pending: 0, failed: 0 }
    })
  })
  
  // Add document summaries
  manualDocuments?.forEach(doc => {
    const employeeId = doc.employee_id
    const employee = employeeMap.get(employeeId)
    
    if (employee) {
      const summary = employee.documentsSummary
      summary.total++
      
      switch (doc.verification_status) {
        case 'verified':
        case 'completed':
          summary.verified++
          break
        case 'pending':
        case 'in-progress':
          summary.pending++
          break
        case 'failed':
        case 'rejected':
          summary.failed++
          break
      }
    }
  })

  const result = Array.from(employeeMap.values())

  console.log('✅ Successfully fetched employees with manual documents:', result.length)
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}