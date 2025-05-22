import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

// Define types for module access
interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string;
  module_id: string;
  access_level?: {
    is_admin?: boolean;
    isAdmin?: boolean;
    isEnabled?: boolean;
    [key: string]: any;
  };
  is_admin?: boolean;
}

interface EmployeeData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  employeeType: string;
  department: string;
  joiningDate?: string;
  status?: boolean | string;
  clientId?: string;
  userId?: string;
  modulePermissions?: Record<string, boolean>;
  moduleAccessPayload?: ModuleAccessItem[];
}

// Setup Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Log authentication status
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', authHeader ? 'Yes' : 'No')

    // Parse request body
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    let body

    try {
      body = JSON.parse(rawBody)
      console.log('Request body parsed successfully:', body)
    } catch (e) {
      console.error('Error parsing request body:', e)
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { operation } = body
    console.log(`Handling operation: ${operation}`)

    // Route to the appropriate handler based on operation
    let result
    switch (operation) {
      case 'create':
        result = await createEmployee(body.employee)
        break
      case 'update':
        result = await updateEmployee(body.employee)
        break
      case 'deactivate':
        result = await deactivateEmployee(body.id)
        break
      case 'delete':
        result = await deleteEmployee(body.id)
        break
      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in employee management function:', error)

    return new Response(JSON.stringify({ error: error.message || 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Validate client exists 
 */
async function validateClient(clientId: string) {
  console.log(`Validating client with ID: ${clientId}`)
  
  if (!clientId) {
    throw new Error('Client ID is required')
  }
  
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()
  
  if (error || !client) {
    console.error('Client validation error:', error)
    throw new Error('Invalid client ID')
  }
  
  return client
}

/**
 * Check if an email already exists for a specific client
 */
async function isEmailExistsForClient(email: string, clientId: string, excludeEmployeeId?: string) {
  console.log(`Checking for existing email ${email} for client ${clientId}`)
  
  let query = supabaseAdmin
    .from('employees')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .eq('client_id', clientId)
  
  // If updating an existing employee, exclude their ID from the check
  if (excludeEmployeeId) {
    query = query.neq('id', excludeEmployeeId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error checking email existence:', error)
    throw error
  }
  
  const exists = data && data.length > 0
  console.log(`Email ${email} exists for client ${clientId}: ${exists}`)
  return exists
}

/**
 * Create a new employee
 */
async function createEmployee(employeeData: EmployeeData) {
  try {
    if (!employeeData) {
      return { error: 'Employee data is required' }
    }
    
    if (!employeeData.clientId) {
      return { error: 'Client ID is required' }
    }
    
    // Validate client exists
    await validateClient(employeeData.clientId)
    
    // Check if email already exists for this client
    const emailExists = await isEmailExistsForClient(employeeData.email, employeeData.clientId)
    if (emailExists) {
      return { 
        error: `An employee with email ${employeeData.email} already exists for this client.`,
        code: 'DUPLICATE_EMAIL'
      }
    }
    
    // Map employee data to DB schema
    const dbEmployee = {
      employee_id: employeeData.employeeId,
      first_name: employeeData.firstName,
      last_name: employeeData.lastName,
      email: employeeData.email.toLowerCase(),
      employee_type: employeeData.employeeType,
      department: employeeData.department,
      joining_date: employeeData.joiningDate,
      status: true, // Default to active
      client_id: employeeData.clientId,
      user_id: employeeData.userId || null,
      is_super_admin: false // Default to false
    }
    
    // Insert employee into database
    const { data: newEmployee, error } = await supabaseAdmin
      .from('employees')
      .insert(dbEmployee)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating employee:', error)
      return { error: `Failed to create employee: ${error.message}` }
    }
    
    console.log('Employee created successfully:', newEmployee)
    
    // Handle module permissions/access if provided
    if (employeeData.moduleAccessPayload && employeeData.moduleAccessPayload.length > 0) {
      try {
        // Process the moduleAccessPayload to ensure each item has employeeId set
        const modulePayload = employeeData.moduleAccessPayload.map(item => ({
          ...item,
          employeeId: newEmployee.id
        }))
        
        await addEmployeeModuleAccess(newEmployee.id, modulePayload)
        console.log("Module access added successfully")
      } catch (moduleError) {
        console.error('Error setting up module access:', moduleError)
        // Continue with employee creation even if module access setup fails
      }
    } else if (employeeData.modulePermissions) {
      try {
        // Convert modulePermissions object to array of ModuleAccessItems
        const moduleAccessItems: ModuleAccessItem[] = Object.entries(employeeData.modulePermissions)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => ({
            name: key,
            key,
            module_id: key, // Assuming key can be used as module_id temporarily
            employeeId: newEmployee.id,
            access_level: {
              isAdmin: true,
              isEnabled: true
            }
          }))
        
        if (moduleAccessItems.length > 0) {
          await addEmployeeModuleAccess(newEmployee.id, moduleAccessItems)
          console.log("Module permissions added successfully")
        }
      } catch (permError) {
        console.error('Error setting up module permissions:', permError)
        // Continue with employee creation even if module permissions setup fails
      }
    }
    
    return { data: newEmployee }
  } catch (error) {
    console.error('Error in createEmployee:', error)
    
    // If it's our known duplicate email error, pass it through
    if (error.code === 'DUPLICATE_EMAIL') {
      return error
    }
    
    return { error: error.message || 'Failed to create employee' }
  }
}

/**
 * Add module access for an employee
 */
async function addEmployeeModuleAccess(employeeId: string, moduleAccessPayload: ModuleAccessItem[]) {
  if (!moduleAccessPayload || moduleAccessPayload.length === 0) {
    console.log("No module access payload provided")
    return { success: true }
  }
  
  try {
    console.log(`Adding module access for employee ${employeeId} with ${moduleAccessPayload.length} modules`)
    
    for (const item of moduleAccessPayload) {
      // Ensure we have the required fields
      if (!item.module_id) {
        console.error("Missing module_id in module access item")
        continue
      }
      
      // Always force these specific values for access_level to ensure they're populated
      const accessLevel = {
        isAdmin: true,
        isEnabled: true,
        ...(item.access_level || {}),  // Keep any existing values but ensure our required ones are set
      };
      
      console.log(`Creating module entry for module ${item.module_id} with access level:`, accessLevel);
      
      // Insert each module entry individually for better error handling
      const { error } = await supabaseAdmin.from('employee_modules').insert({
        employee_id: employeeId,
        module_id: item.module_id,
        access_level: accessLevel
      });
      
      if (error) {
        console.error(`Error adding module access for module ${item.module_id}:`, error);
        continue;
      }
      
      console.log(`Successfully added module access for module ${item.module_id} to employee ${employeeId}`);
    }
    
    console.log(`Successfully completed adding module access entries for employee: ${employeeId}`);
    console.log("Module access updated successfully");
    return { success: true };
  } catch (error) {
    console.error('Error adding module access:', error);
    return { error: 'Failed to add module access' };
  }
}

/**
 * Deactivate an employee by setting their status to false
 */
async function deactivateEmployee(id: string) {
  try {
    if (!id) {
      return { error: 'Employee ID is required' }
    }
    
    console.log(`Deactivating employee with ID: ${id}`)
    
    // Update the employee status to false (inactive)
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update({ status: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error deactivating employee:', error)
      return { error: `Failed to deactivate employee: ${error.message}` }
    }
    
    // Delete all module access for deactivated employee
    const { error: moduleError } = await supabaseAdmin
      .from('employee_modules')
      .delete()
      .eq('employee_id', id)
    
    if (moduleError) {
      console.error('Error removing module permissions:', moduleError)
      // Continue anyway as the employee has been deactivated
    } else {
      console.log('Successfully removed all module permissions for deactivated employee')
    }
    
    console.log('Employee deactivated successfully:', data)
    return { data, success: true }
  } catch (error) {
    console.error('Error in deactivateEmployee:', error)
    return { error: error.message || 'Failed to deactivate employee' }
  }
}

/**
 * Permanently delete an employee
 */
async function deleteEmployee(id: string) {
  try {
    if (!id) {
      return { error: 'Employee ID is required' }
    }
    
    console.log(`Deleting employee with ID: ${id}`)
    
    // First, delete all module access for this employee
    const { error: moduleError } = await supabaseAdmin
      .from('employee_modules')
      .delete()
      .eq('employee_id', id)
    
    if (moduleError) {
      console.error('Error deleting module access:', moduleError)
      // Continue with employee deletion anyway
    }
    
    // Then delete the employee
    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting employee:', error)
      return { error: `Failed to delete employee: ${error.message}` }
    }
    
    console.log('Employee deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteEmployee:', error)
    return { error: error.message || 'Failed to delete employee' }
  }
}

// Improved updateEmployee function with fixed module access handling
async function updateEmployee(employee: any) {
  try {
    if (!employee || !employee.id) {
      return { error: 'Employee data with ID is required for updates' }
    }
    
    console.log(`Updating employee with ID: ${employee.id} for client: ${employee.clientId}`)
    
    // Validate client exists if clientId is provided
    if (employee.clientId) {
      await validateClient(employee.clientId)
    }
    
    // Check if email is being changed, and if so, check for duplicates
    if (employee.email) {
      console.log(`Checking for existing email ${employee.email} for client ${employee.clientId}`)
      const emailExists = await isEmailExistsForClient(employee.email, employee.clientId, employee.id)
      if (emailExists) {
        return {
          error: `Another employee with email ${employee.email} already exists for this client.`,
          code: 'DUPLICATE_EMAIL'
        }
      }
    }
    
    // Prepare update data - only include fields that are provided
    const updateData: any = {}
    
    if (employee.firstName) updateData.first_name = employee.firstName
    if (employee.lastName) updateData.last_name = employee.lastName
    if (employee.email) updateData.email = employee.email.toLowerCase()
    if (employee.employeeType) updateData.employee_type = employee.employeeType
    if (employee.department) updateData.department = employee.department
    if (employee.joiningDate) updateData.joining_date = employee.joiningDate
    if (employee.status !== undefined) updateData.status = employee.status
    
    console.log('Update data:', updateData)
    
    // Update employee in database
    const { data: updatedEmployee, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', employee.id)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error updating employee:', error)
      return { error: `Failed to update employee: ${error.message}` }
    }
    
    console.log('Employee updated successfully:', updatedEmployee)
    
    // Handle module access updates if provided
    if (employee.moduleAccessPayload && employee.moduleAccessPayload.length > 0) {
      try {
        // First, delete all existing module access
        console.log(`Deleting all module access for employee: ${employee.id}`)
        const { error: deleteError } = await supabaseAdmin
          .from('employee_modules')
          .delete()
          .eq('employee_id', employee.id)
        
        if (deleteError) {
          console.error('Error deleting module access:', deleteError)
          return { data: updatedEmployee, warning: 'Employee updated but failed to update module access' }
        }
        
        console.log(`Successfully deleted all module access for employee: ${employee.id}`)
        
        // Then add new module access
        // Process the payload to ensure it has proper access_level structure
        const processedPayload = employee.moduleAccessPayload.map((item: any) => {
          // If item has is_admin property, include it in access_level
          if (item.hasOwnProperty('is_admin')) {
            return {
              ...item,
              access_level: { 
                isAdmin: true,  // Force these specific values
                isEnabled: true
              }
            };
          }
          
          // Otherwise, return the item with hardcoded access_level
          return {
            ...item,
            access_level: {
              isAdmin: true,  // Force these specific values
              isEnabled: true
            }
          };
        });
        
        // Use the improved function to handle module access with processed payload
        await addEmployeeModuleAccess(employee.id, processedPayload)
        console.log("Module access updated successfully")
      } catch (moduleError) {
        console.error('Error updating module access:', moduleError)
        return {
          data: updatedEmployee,
          warning: 'Employee updated but module access update failed'
        }
      }
    }
    
    return { data: updatedEmployee }
  } catch (error) {
    console.error('Error in updateEmployee:', error)
    return { error: error.message || 'Failed to update employee' }
  }
}
