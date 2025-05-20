
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Employee management function
async function handleEmployeeOperation(operation: string, employeeData: any) {
  console.log(`Handling operation: ${operation}`);
  
  // Special case for bulk imports
  if (operation === 'bulk_import' && Array.isArray(employeeData)) {
    return await handleBulkImport(employeeData);
  }
  
  // Validate that employeeData exists for operations that require it
  if (!employeeData && ['create', 'update'].includes(operation)) {
    return { error: 'Employee data is required for this operation' };
  }
  
  // For delete and deactivate operations, we only need the ID
  if (['delete', 'deactivate'].includes(operation)) {
    if (!employeeData || !employeeData.id) {
      return { error: 'Employee ID is required for this operation' };
    }
  }
  
  switch (operation) {
    case 'create':
      return await createEmployee(employeeData);
    case 'update':
      return await updateEmployee(employeeData);
    case 'deactivate':
      return await deactivateEmployee(employeeData.id || employeeData);
    case 'delete':
      return await deleteEmployee(employeeData.id || employeeData);
    case 'get':
      return employeeData && employeeData.id 
        ? await getEmployee(employeeData.id)
        : { error: 'Employee ID is required for get operation' };
    case 'list':
      return employeeData && employeeData.clientId 
        ? await listEmployees(employeeData.clientId)
        : { error: 'Client ID is required for list operation' };
    case 'add_module_access':
      return (employeeData && employeeData.moduleAccessPayload && employeeData.id)
        ? await addEmployeeModuleAccess(employeeData.moduleAccessPayload, employeeData.id)
        : { error: 'Module access payload and employee ID are required' };
    default:
      return { error: 'Invalid operation' };
  }
}

// Add a new function to handle bulk employee imports
async function handleBulkImport(employees: any[]) {
  console.log(`Processing bulk import of ${employees.length} employees`);
  
  const results = {
    created: 0,
    updated: 0,
    errors: [],
    employees: [],
    success: true
  };
  
  try {
    // Process each employee in the array
    for (const employee of employees) {
      try {
        // Check if employee with same email already exists
        if (employee.email && employee.clientId) {
          const { data: existingEmployee, error: checkError } = await supabase
            .from('employees')
            .select('id')
            .eq('email', employee.email)
            .eq('client_id', employee.clientId)
            .single();
            
          if (!checkError && existingEmployee) {
            // Employee exists, update it
            console.log(`Updating existing employee with email ${employee.email}`);
            
            // Map to DB schema
            const dbEmployee = {
              first_name: employee.firstName,
              last_name: employee.lastName,
              employee_type: employee.employeeType,
              department: employee.department,
              joining_date: employee.joiningDate,
              // Don't update email as it's being used to identify the employee
              status: employee.status === 'active' ? true : false
            };
            
            const { data: updatedEmp, error: updateError } = await supabase
              .from('employees')
              .update(dbEmployee)
              .eq('id', existingEmployee.id)
              .select('*')
              .single();
              
            if (updateError) {
              throw updateError;
            }
            
            // Update module access if provided
            if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload)) {
              await addEmployeeModuleAccess(employee.moduleAccessPayload, existingEmployee.id);
            }
            
            results.updated++;
            results.employees.push(updatedEmp);
            
          } else {
            // Employee doesn't exist, create new one
            console.log(`Creating new employee with email ${employee.email}`);
            
            // Map to DB schema
            const dbEmployee = {
              employee_id: employee.employeeId,
              first_name: employee.firstName,
              last_name: employee.lastName,
              email: employee.email,
              employee_type: employee.employeeType,
              department: employee.department,
              joining_date: employee.joiningDate,
              status: employee.status === 'active' ? true : false,
              client_id: employee.clientId,
              user_id: employee.userId
            };
            
            const { data: newEmployee, error: insertError } = await supabase
              .from('employees')
              .insert(dbEmployee)
              .select('*')
              .single();
              
            if (insertError) {
              throw insertError;
            }
            
            // Add module access if provided
            if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload) && newEmployee) {
              await addEmployeeModuleAccess(employee.moduleAccessPayload, newEmployee.id);
            }
            
            results.created++;
            results.employees.push(newEmployee);
          }
        } else {
          throw new Error('Email and clientId are required for each employee');
        }
      } catch (employeeError) {
        console.error(`Error processing employee ${employee.email}:`, employeeError);
        results.errors.push(`Error processing ${employee.firstName} ${employee.lastName}: ${employeeError.message}`);
      }
    }
    
    return results;
  } catch (bulkError) {
    console.error("Error in bulk import:", bulkError);
    return { 
      error: bulkError.message, 
      success: false 
    };
  }
}

async function createEmployee(employee: any) {
  console.log("Creating employee:", employee);
  
  try {
    // Check if an employee with the same email already exists for this client
    if (employee.email && employee.clientId) {
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', employee.email)
        .eq('client_id', employee.clientId)
        .single();
      
      if (!checkError && existingEmployee) {
        console.log(`Employee with email ${employee.email} already exists for this client`);
        return { 
          error: `An employee with email ${employee.email} already exists for this client.`,
          code: 'DUPLICATE_EMAIL'
        };
      }
    }
    
    // Map the incoming employee data to database schema
    const dbEmployee = {
      employee_id: employee.employeeId,
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      employee_type: employee.employeeType,
      department: employee.department,
      joining_date: employee.joiningDate,
      status: employee.status === 'active' ? true : false, // Convert string status to boolean
      client_id: employee.clientId,
      user_id: employee.userId
    };
    
    console.log("DB employee data for insert:", dbEmployee);
    
    // Insert the employee into the database
    const { data: newEmployee, error } = await supabase
      .from('employees')
      .insert(dbEmployee)
      .select('*')
      .single();
      
    if (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
    
    // If module access payload exists, add employee module access
    if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload) && newEmployee) {
      await addEmployeeModuleAccess(employee.moduleAccessPayload, newEmployee.id);
    }
    
    return { data: newEmployee };
  } catch (error) {
    console.error("Error in createEmployee:", error);
    return { error: error.message };
  }
}

async function addEmployeeModuleAccess(moduleAccess: any[], employeeId: string) {
  console.log("Adding module access for employee:", employeeId);
  console.log("Module access payload:", moduleAccess);
  
  try {
    // For each module in the payload, insert into employee_modules
    const moduleInserts = await Promise.all(moduleAccess.map(async (module) => {
      // We expect module_id to be provided in the payload now
      const moduleId = module.module_id;
      
      if (!moduleId) {
        console.log(`Module ID missing for module: ${module.name}`);
        return null;
      }
      
      // Insert into employee_modules
      const { data, error } = await supabase
        .from('employee_modules')
        .insert({
          employee_id: employeeId,
          module_id: moduleId,
          access_level: {} // Default empty access level
        });
        
      if (error) {
        console.error(`Error adding module access for ${module.name}:`, error);
        return null;
      }
      
      return data;
    }));
    
    return moduleInserts.filter(Boolean);
  } catch (error) {
    console.error("Error in addEmployeeModuleAccess:", error);
    throw error;
  }
}

async function updateEmployee(employee: any) {
  // Implementation for updating an employee
  return { error: 'Not implemented yet' };
}

async function deactivateEmployee(id: string) {
  try {
    console.log(`Deactivating employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required for deactivation" };
    }
    
    // First update the employee status to 'inactive' (false)
    const { data, error } = await supabase
      .from('employees')
      .update({ status: false })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error("Error deactivating employee:", error);
      return { error: error.message };
    }
    
    // Then clear all module permissions for deactivated employee
    const { error: moduleError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', id);
      
    if (moduleError) {
      console.error("Error removing module permissions:", moduleError);
      return { 
        data, 
        warning: "Employee deactivated but module permissions could not be removed"
      };
    }
    
    return { data, message: "Employee deactivated successfully" };
  } catch (error) {
    console.error("Error in deactivateEmployee:", error);
    return { error: error.message || "Failed to deactivate employee" };
  }
}

async function deleteEmployee(id: string) {
  try {
    console.log(`Deleting employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required for deletion" };
    }
    
    // First, delete all module permissions for this employee
    const { error: moduleError } = await supabase
      .from('employee_modules')
      .delete()
      .eq('employee_id', id);

    if (moduleError) {
      console.error("Error deleting employee module permissions:", moduleError);
      // Continue with employee deletion even if module deletion fails
    }

    // Then delete the employee
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting employee:", error);
      return { error: error.message || "Failed to delete employee" };
    }

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return { error: error.message || "Failed to delete employee" };
  }
}

async function getEmployee(id: string) {
  try {
    console.log(`Getting employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required" };
    }
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error("Error fetching employee:", error);
      return { error: error.message };
    }
    
    return { data };
  } catch (error) {
    console.error("Error in getEmployee:", error);
    return { error: error.message || "Failed to get employee" };
  }
}

async function listEmployees(clientId: string) {
  try {
    console.log(`Listing employees for client ID: ${clientId}`);
    
    if (!clientId) {
      return { error: "Client ID is required" };
    }
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('client_id', clientId);
      
    if (error) {
      console.error("Error listing employees:", error);
      return { error: error.message };
    }
    
    return { data };
  } catch (error) {
    console.error("Error in listEmployees:", error);
    return { error: error.message || "Failed to list employees" };
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Auth header present:", req.headers.has('authorization') ? "Yes" : "No");
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));

    // Get the request path
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    console.log("Request path:", path);

    // Determine the final path
    const finalPath = path || 'employee-management';
    console.log("Final determined path:", finalPath);

    // Parse the request body
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    let reqBody;
    try {
      reqBody = JSON.parse(rawBody);
      console.log("Request body parsed successfully:", reqBody);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for bulk import operation
    if (reqBody.operation === 'bulk_import' && Array.isArray(reqBody.employees)) {
      console.log("Handling bulk import operation");
      const result = await handleBulkImport(reqBody.employees);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract operation and employee data
    const { operation, employee } = reqBody;
    
    // For delete/deactivate operations, we need to handle the ID directly
    let employeeData = employee;
    if ((operation === 'delete' || operation === 'deactivate') && !employee && reqBody.id) {
      employeeData = reqBody.id;
      console.log(`Handling ${operation} operation with ID:`, employeeData);
    }
    
    // Handle the employee operation
    const result = await handleEmployeeOperation(operation, employeeData);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
