import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const supabaseUrl = getSupabaseUrl()
const supabaseServiceKey = getSupabaseServiceRoleKey()

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
    let body: any = {}
    try {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        body = await req.json()
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      // If body is empty or invalid, continue with empty body (for GET-like requests)
      body = {}
    }

    const { action, ...payload } = body
    console.log('Backoffice client management request:', { action, payload, method: req.method })

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    switch (action) {
      case 'fetchAllClients':
        return await fetchAllClients()
      case 'fetch-clients':
        return await fetchAllClients()
      case 'fetchEmployeesByClient':
        if (!payload.clientId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Client ID is required' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        return await fetchEmployeesByClient(payload.clientId)
      case 'fetchAllEmployees':
        return await fetchAllEmployees()
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('Error in backoffice client management:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { 
        status: 500,
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

  console.log('🔍 Fetching employees with manual documents and failed passports for client:', clientId)

  // Get document type IDs for manual and passport
  const { data: documentTypes, error: docTypeError } = await supabase
    .from('employee_document_type')
    .select('id, name')

  if (docTypeError) {
    console.error('Error fetching document types:', docTypeError)
    throw docTypeError
  }

  const manualDocTypeId = documentTypes?.find(type => (type.name || '').toLowerCase() === 'manual')?.id
  const passportDocTypeId = documentTypes?.find(type => (type.name || '').toLowerCase() === 'passport')?.id

  if (!manualDocTypeId && !passportDocTypeId) {
    console.log('⚠️ Manual/Passport document types not found, returning empty result')
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Fetch manual documents and passport documents (passport later filtered to failed only)
  const typeIdsToFetch = [manualDocTypeId, passportDocTypeId].filter(Boolean)
  const { data: documents, error: documentsError } = await supabase
    .from('employee_documents')
    .select(`
      employee_id,
      verification_status,
      api_verification_status,
      document_type_id
    `)
    .in('document_type_id', typeIdsToFetch as string[])
    .eq('is_delete', 0)

  if (documentsError) {
    console.error('Error fetching manual documents:', documentsError)
    throw documentsError
  }

  const relevantDocuments = (documents || []).filter(doc => {
    if (doc.document_type_id === manualDocTypeId) return true
    return doc.document_type_id === passportDocTypeId && (doc.verification_status === 'failed' || doc.api_verification_status === 'failed')
  })

  console.log('📊 Found relevant documents (manual + failed passport):', relevantDocuments.length)

  // Get unique employee IDs from relevant documents
  const employeeIdsWithRelevantDocs = [...new Set(relevantDocuments.map(doc => doc.employee_id))]
  console.log('👥 Employee IDs with relevant docs:', employeeIdsWithRelevantDocs)

  if (employeeIdsWithRelevantDocs.length === 0) {
    console.log('⚠️ No employees found with relevant documents')
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Fetch employees who have relevant documents
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, employee_id, first_name, last_name, email, department, employee_type, client_id, created_at')
    .in('id', employeeIdsWithRelevantDocs)
    .eq('client_id', clientId)
    .eq('status', true)
    .order('first_name')

  if (employeesError) {
    console.error('Error fetching employees:', employeesError)
    throw employeesError
  }

  console.log('👥 Found employees with relevant docs:', employees?.length || 0)

  // Group relevant documents by employee and create summaries
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
      createdAt: emp.created_at || null,
      documentsSummary: { total: 0, verified: 0, pending: 0, inProgress: 0, failed: 0 }
    })
  })
  
  // Add document summaries
  relevantDocuments.forEach(doc => {
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
          summary.pending++
          break
        case 'in-progress':
          summary.inProgress++
          break
        case 'failed':
        case 'rejected':
          summary.failed++
          break
      }
    }
  })

  const result = Array.from(employeeMap.values())

  console.log('✅ Successfully fetched employees with manual documents and failed passports:', result.length)
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function fetchAllEmployees() {
  try {
    console.log('🔍 Fetching all employees with manual documents and failed passports across all clients')

    // Get document type IDs for manual and passport
    const { data: documentTypes, error: docTypeError } = await supabase
      .from('employee_document_type')
      .select('id, name')

    if (docTypeError) {
      console.error('Error fetching document types:', docTypeError)
      throw new Error(`Failed to fetch document types: ${docTypeError.message}`)
    }

    const manualDocTypeId = documentTypes?.find(type => (type.name || '').toLowerCase() === 'manual')?.id
    const passportDocTypeId = documentTypes?.find(type => (type.name || '').toLowerCase() === 'passport')?.id

    if (!manualDocTypeId && !passportDocTypeId) {
      console.log('⚠️ Manual/Passport document types not found, returning empty result')
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Found manual/passport document type IDs:', { manualDocTypeId, passportDocTypeId })

    // Fetch manual documents and passport documents (passport later filtered to failed only)
    const typeIdsToFetch = [manualDocTypeId, passportDocTypeId].filter(Boolean)
    const { data: documents, error: documentsError } = await supabase
      .from('employee_documents')
      .select(`
        employee_id,
        verification_status,
        api_verification_status,
        document_type_id
      `)
      .in('document_type_id', typeIdsToFetch as string[])
      .eq('is_delete', 0)

    if (documentsError) {
      console.error('Error fetching relevant documents:', documentsError)
      throw new Error(`Failed to fetch relevant documents: ${documentsError.message}`)
    }

    const relevantDocuments = (documents || []).filter(doc => {
      if (doc.document_type_id === manualDocTypeId) return true
      return doc.document_type_id === passportDocTypeId && (doc.verification_status === 'failed' || doc.api_verification_status === 'failed')
    })

    console.log('📊 Found relevant documents (manual + failed passport):', relevantDocuments.length)

    if (!relevantDocuments || relevantDocuments.length === 0) {
      console.log('⚠️ No relevant documents found')
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get unique employee IDs from relevant documents
    const employeeIdsWithRelevantDocs = [...new Set(relevantDocuments.map(doc => doc.employee_id).filter(Boolean))]
    console.log('👥 Employee IDs with relevant docs:', employeeIdsWithRelevantDocs.length)

    if (employeeIdsWithRelevantDocs.length === 0) {
      console.log('⚠️ No employees found with relevant documents')
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch employees who have relevant documents (across all clients)
    // Split into chunks if too many IDs to avoid query size limits
    const chunkSize = 1000
    const allEmployees: any[] = []
    
    for (let i = 0; i < employeeIdsWithRelevantDocs.length; i += chunkSize) {
      const chunk = employeeIdsWithRelevantDocs.slice(i, i + chunkSize)
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, department, employee_type, client_id, created_at')
        .in('id', chunk)
        .eq('status', true)
        .order('first_name')

      if (employeesError) {
        console.error('Error fetching employees chunk:', employeesError)
        throw new Error(`Failed to fetch employees: ${employeesError.message}`)
      }

      if (employees) {
        allEmployees.push(...employees)
      }
    }

    console.log('👥 Found employees with relevant docs:', allEmployees.length)

    // Group relevant documents by employee and create summaries
    const employeeMap = new Map()
    
    // Initialize employee map with employee data
    allEmployees.forEach(emp => {
      employeeMap.set(emp.id, {
        id: emp.id,
        employeeId: emp.employee_id || '',
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
        email: emp.email || '',
        department: emp.department || '',
        position: emp.employee_type || '',
        clientId: emp.client_id,
        createdAt: emp.created_at || null,
        documentsSummary: { total: 0, verified: 0, pending: 0, inProgress: 0, failed: 0 }
      })
    })
    
    // Add document summaries
    relevantDocuments.forEach(doc => {
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
            summary.pending++
            break
          case 'in-progress':
            summary.inProgress++
            break
          case 'failed':
          case 'rejected':
            summary.failed++
            break
        }
      }
    })

    const result = Array.from(employeeMap.values())

    console.log('✅ Successfully fetched all employees with manual documents and failed passports:', result.length)
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in fetchAllEmployees:', error)
    throw error
  }
}