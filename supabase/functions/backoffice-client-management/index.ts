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

const AUDIT_STATUS_TYPE_NAMES = ['passport', 'pan', 'aadhar', 'driving_license', 'voter_id']

function isRelevantBackofficeDocument(
  doc: { id?: string; document_type_id?: string | null; verification_status?: string | null },
  manualDocTypeId: string | undefined,
  auditStatusTypeIds: string[],
  auditByDocumentId: Map<string, { both_fallback: boolean | null; latest_status_code: number | null }>
) {
  if (doc.document_type_id === manualDocTypeId) return true
  if (!doc.id) return false

  // First gate by current verification status from employee_documents
  const verificationStatus = (doc.verification_status || '').toLowerCase()
  if (verificationStatus === 'verified' || verificationStatus === 'completed') {
    return false
  }

  const audit = auditByDocumentId.get(doc.id)

  if (doc.document_type_id && auditStatusTypeIds.includes(doc.document_type_id)) {
    console.log(doc,'doci=uemtjrgnkfjdbfkdj');
    
    return typeof audit?.latest_status_code === 'number' && doc?.api_verification_status =='failed'
    // && audit.latest_status_code !== 422
  }
  return false
}

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

  console.log('🔍 Fetching employees with backoffice-relevant documents for client:', clientId)

  // Resolve relevant document type IDs
  const { data: documentTypes, error: docTypeError } = await supabase
    .from('employee_document_type')
    .select('id, name')

  if (docTypeError) {
    console.error('Error fetching document types:', docTypeError)
    throw docTypeError
  }

  const typeIdByName = new Map((documentTypes || []).map(type => [(type.name || '').toLowerCase(), type.id] as const))
  const manualDocTypeId = typeIdByName.get('manual')
  const auditStatusTypeIds = AUDIT_STATUS_TYPE_NAMES.map(name => typeIdByName.get(name)).filter(Boolean) as string[]

  if (!manualDocTypeId && auditStatusTypeIds.length === 0) {
    console.log('⚠️ Relevant document types not found, returning empty result')
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Fetch all potentially relevant documents first
  const typeIdsToFetch = [manualDocTypeId, ...auditStatusTypeIds].filter(Boolean)
  const { data: documents, error: documentsError } = await supabase
    .from('employee_documents')
    .select(`
      id,
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

  const nonManualDocIds = (documents || [])
    .filter(doc => doc.document_type_id !== manualDocTypeId)
    .map(doc => doc.id)
    .filter(Boolean)
  const auditByDocumentId = new Map<string, { both_fallback: boolean | null; latest_status_code: number | null }>()

  if (nonManualDocIds.length > 0) {
    const { data: auditData, error: auditError } = await supabase
      .from('employee_verification_audit_log')
      .select('document_id, both_fallback, latest_status_code')
      .in('document_id', nonManualDocIds)

    if (auditError) {
      console.error('Error fetching verification audit logs:', auditError)
      throw auditError
    }

    ;(auditData || []).forEach(row => {
      auditByDocumentId.set(row.document_id, {
        both_fallback: row.both_fallback ?? null,
        latest_status_code: row.latest_status_code ?? null
      })
    })
  }

  const relevantDocuments = (documents || []).filter(doc =>
    isRelevantBackofficeDocument(doc, manualDocTypeId, auditStatusTypeIds, auditByDocumentId)
  )

  console.log('📊 Found relevant documents (manual + audit-rule failures):', relevantDocuments.length)

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

  console.log('✅ Successfully fetched employees with backoffice-relevant documents:', result.length)
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function fetchAllEmployees() {
  try {
    console.log('🔍 Fetching all employees with backoffice-relevant documents across all clients')

    // Resolve relevant document type IDs
    const { data: documentTypes, error: docTypeError } = await supabase
      .from('employee_document_type')
      .select('id, name')

    if (docTypeError) {
      console.error('Error fetching document types:', docTypeError)
      throw new Error(`Failed to fetch document types: ${docTypeError.message}`)
    }

    const typeIdByName = new Map((documentTypes || []).map(type => [(type.name || '').toLowerCase(), type.id] as const))
    const manualDocTypeId = typeIdByName.get('manual')
    const auditStatusTypeIds = AUDIT_STATUS_TYPE_NAMES.map(name => typeIdByName.get(name)).filter(Boolean) as string[]

    if (!manualDocTypeId && auditStatusTypeIds.length === 0) {
      console.log('⚠️ Relevant document types not found, returning empty result')
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Found relevant document type IDs:', { manualDocTypeId, auditStatusTypeIds })

    // Fetch all potentially relevant documents first
    const typeIdsToFetch = [manualDocTypeId, ...auditStatusTypeIds].filter(Boolean)
    const { data: documents, error: documentsError } = await supabase
      .from('employee_documents')
      .select(`
        id,
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

    const nonManualDocIds = (documents || [])
      .filter(doc => doc.document_type_id !== manualDocTypeId)
      .map(doc => doc.id)
      .filter(Boolean)
    const auditByDocumentId = new Map<string, { both_fallback: boolean | null; latest_status_code: number | null }>()

    if (nonManualDocIds.length > 0) {
      const { data: auditData, error: auditError } = await supabase
        .from('employee_verification_audit_log')
        .select('document_id, both_fallback, latest_status_code')
        .in('document_id', nonManualDocIds)

      if (auditError) {
        console.error('Error fetching verification audit logs:', auditError)
        throw new Error(`Failed to fetch verification audit logs: ${auditError.message}`)
      }

      ;(auditData || []).forEach(row => {
        auditByDocumentId.set(row.document_id, {
          both_fallback: row.both_fallback ?? null,
          latest_status_code: row.latest_status_code ?? null
        })
      })
    }

    const relevantDocuments = (documents || []).filter(doc =>
      isRelevantBackofficeDocument(doc, manualDocTypeId, auditStatusTypeIds, auditByDocumentId)
    )

    console.log('📊 Found relevant documents (manual + audit-rule failures):', relevantDocuments.length)

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

    console.log('✅ Successfully fetched all employees with backoffice-relevant documents:', result.length)
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