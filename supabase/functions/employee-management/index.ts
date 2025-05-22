
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleAccessItem {
  name: string;
  key: string;
  module_id?: string;
  employeeId?: string;
}

interface EmployeeData {
  id?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeType?: string;
  department?: string;
  joiningDate?: string;
  status?: 'active' | 'inactive' | boolean;
  clientId?: string;
  modulePermissions?: Record<string, boolean>;
  moduleAccessPayload?: ModuleAccessItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Create a Supabase client with the provided service role key
const supabaseAdmin = createClient(
  // Supabase API URL - env var exported by default when deployed
  Deno.env.get('SUPABASE_URL') ?? '',
  // Supabase service role key - env var exported by default when deployed
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Function to check if an email already exists for a client
async function checkForExistingEmail(
  email: string, 
  clientId: string | undefined, 
  currentEmployeeId?: string
): Promise<boolean> {
  try {
    // Build query
    let query = supabaseAdmin
      .from('employees')
      .select('id, email')
      .eq('email', email);
    
    // Add client_id filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    // Exclude current employee if updating
    if (currentEmployeeId) {
      query = query.neq('id', currentEmployeeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking for existing email:", error);
      return false; // Assume no duplicate if error (will be caught elsewhere)
    }
    
    // If data exists and has length, then there's a duplicate
    return data && data.length > 0;
  } catch (error) {
    console.error("Exception checking for existing email:", error);
    return false;
  }
}

// Function to add module access for an employee
async function addEmployeeModuleAccess(
  moduleAccessItems: ModuleAccessItem[], 
  employeeId: string
): Promise<void> {
  try {
    if (!moduleAccessItems || moduleAccessItems.length === 0) {
      console.log("No module access items to add");
      return;
    }
    
    const moduleEntries = moduleAccessItems.map(item => {
      // Ensure access_level includes is_admin property
      const access_level = item.access_level || {};
      
      return {
        employee_id: employeeId,
        module_id: item.module_id || item.key, // Use module_id if provided, otherwise fallback to key
        access_level: access_level // This now properly includes the is_admin property
      };
    });
    
    console.log("Adding module entries:", moduleEntries);
    
    const { error } = await supabaseAdmin
      .from('employee_modules')
      .insert(moduleEntries);
    
    if (error) {
      console.error("Error inserting module entries:", error);
      throw error;
    }
    
    console.log(`Successfully added ${moduleEntries.length} module access entries for employee: ${employeeId}`);
  } catch (error) {
    console.error("Error adding employee module access:", error);
    throw error;
  }
}

// Function to delete all module access for an employee
async function deleteEmployeeModuleAccess(employeeId: string): Promise<void> {
  try {
    console.log(`Deleting all module access for employee: ${employeeId}`);
    
    const { error } = await supabaseAdmin
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);
    
    if (error) {
      console.error("Error deleting employee module access:", error);
      throw error;
    }
    
    console.log(`Successfully deleted all module access for employee: ${employeeId}`);
  } catch (error) {
    console.error("Error in deleteEmployeeModuleAccess:", error);
    throw error;
  }
}

// Function to create a new employee
async function createEmployee(employee: EmployeeData): Promise<any> {
  try {
    // Check if an employee with the same email already exists for this client
    const emailExists = await checkForExistingEmail(employee.email, employee.clientId);
    
    if (emailExists) {
      return { 
        error: `An employee with email ${employee.email} already exists for this client.`,
        code: 'DUPLICATE_EMAIL',
        success: false
      };
    }
    
    // Map employee data to match DB schema
    const employeeData = {
      employee_id: employee.employeeId || '',
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      employee_type: employee.employeeType || 'permanent',
      department: employee.department || '',
      joining_date: employee.joiningDate || new Date().toISOString(),
      status: employee.status === 'inactive' ? false : true,
      client_id: employee.clientId
    };
    
    console.log("Inserting employee:", employeeData);
    
    // Insert the employee into the employees table
    const { data: newEmployee, error } = await supabaseAdmin
      .from('employees')
      .insert(employeeData)
      .select('*')
      .single();
      
    if (error) {
      console.error("Error creating employee:", error);
      return { 
        error: error.message, 
        success: false,
        code: error.code
      };
    }
    
    // If module access payload exists, add employee module access
    if (employee.moduleAccessPayload && employee.moduleAccessPayload.length > 0) {
      await addEmployeeModuleAccess(employee.moduleAccessPayload, newEmployee.id);
    }
    
    return { 
      data: newEmployee, 
      success: true 
    };
  } catch (error) {
    console.error("Error in createEmployee:", error);
    return { 
      error: error.message, 
      success: false
    };
  }
}

// Employee management function
async function handleEmployeeOperation(operation: string, employeeData: any) {
  console.log(`Handling operation: ${operation}`);
  console.log(`Employee data received:`, employeeData);
  
  // Special case for bulk imports
  if (operation === 'bulk_import' && Array.isArray(employeeData)) {
    return await handleBulkImport(employeeData);
  }
  
  // For delete and deactivate operations, we need to validate the ID is present
  if (['delete', 'deactivate'].includes(operation)) {
    // Check if we have a direct ID string or an object with an ID property
    let employeeId: string | null = null;
    
    if (typeof employeeData === 'string') {
      // Direct ID string
      employeeId = employeeData;
      console.log(`Found ID directly in employeeData: ${employeeId}`);
    } else if (employeeData && typeof employeeData === 'object') {
      // ID within an object
      employeeId = employeeData.id;
      console.log(`Found ID in employeeData.id: ${employeeId}`);
    }
    
    if (!employeeId) {
      console.error("Missing employee ID for operation:", operation);
      return { error: 'Employee ID is required for this operation' };
    }
    
    if (operation === 'deactivate') {
      return await deactivateEmployee(employeeId);
    } else if (operation === 'delete') {
      return await deleteEmployee(employeeId);
    }
  }
  
  // For other operations that require full employeeData
  if (!employeeData && ['create', 'update'].includes(operation)) {
    return { error: 'Employee data is required for this operation' };
  }
  
  // Continue with the appropriate operation
  switch (operation) {
    case 'create':
      return await createEmployee(employeeData);
    case 'update':
      return await updateEmployee(employeeData);
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
          const { data: existingEmployee, error: checkError } = await supabaseAdmin
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
            
            const { data: updatedEmp, error: updateError } = await supabaseAdmin
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
            
            const { data: newEmployee, error: insertError } = await supabaseAdmin
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

// Implement the updateEmployee function for updating an employee's information and module access
async function updateEmployee(employee: any) {
  try {
    if (!employee || !employee.id) {
      return { error: "Employee ID is required for update operation" };
    }
    
    console.log(`Updating employee with ID: ${employee.id}`);
    
    // Check if email already exists for another employee in the same client
    if (employee.email && employee.clientId) {
      const emailExists = await checkForExistingEmail(
        employee.email, 
        employee.clientId, 
        employee.id // Exclude current employee from check
      );
      
      if (emailExists) {
        return { 
          error: `Another employee with email ${employee.email} already exists for this client.`,
          code: 'DUPLICATE_EMAIL',
          success: false
        };
      }
    }
    
    // Prepare the employee data for update
    const updateData: Record<string, any> = {};
    
    // Only include fields that are provided in the update
    if (employee.firstName !== undefined) updateData.first_name = employee.firstName;
    if (employee.lastName !== undefined) updateData.last_name = employee.lastName;
    if (employee.email !== undefined) updateData.email = employee.email;
    if (employee.employeeType !== undefined) updateData.employee_type = employee.employeeType;
    if (employee.department !== undefined) updateData.department = employee.department;
    if (employee.joiningDate !== undefined) updateData.joining_date = employee.joiningDate;
    if (employee.status !== undefined) {
      // Convert status to boolean if it's not already
      updateData.status = employee.status === 'active' || employee.status === true ? true : false;
    }
    
    console.log("Update data:", updateData);
    
    // Update the employee in the database if there are fields to update
    let updatedEmployee;
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('employees')
        .update(updateData)
        .eq('id', employee.id)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error updating employee:", error);
        return { 
          error: error.message, 
          success: false 
        };
      }
      
      updatedEmployee = data;
    } else {
      // If no fields to update, just fetch the current employee data
      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('id', employee.id)
        .single();
        
      if (error) {
        console.error("Error fetching employee:", error);
        return { 
          error: error.message, 
          success: false 
        };
      }
      
      updatedEmployee = data;
    }
    
    // Handle module access updates if provided
    if (employee.moduleAccessPayload) {
      try {
        // First delete all existing module access for this employee
        await deleteEmployeeModuleAccess(employee.id);
        
        // Then add the new module access if any are provided
        if (Array.isArray(employee.moduleAccessPayload) && employee.moduleAccessPayload.length > 0) {
          await addEmployeeModuleAccess(employee.moduleAccessPayload, employee.id);
        }
      } catch (moduleError) {
        console.error("Error updating module access:", moduleError);
        return {
          data: updatedEmployee,
          warning: "Employee updated but there was an issue with module access",
          success: true
        };
      }
    }
    
    console.log("Employee updated successfully:", updatedEmployee);
    
    return { 
      data: updatedEmployee,
      message: "Employee updated successfully",
      success: true 
    };
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    return { 
      error: error.message || "Failed to update employee", 
      success: false 
    };
  }
}

async function deactivateEmployee(id: string) {
  try {
    console.log(`Deactivating employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required for deactivation" };
    }
    
    // First update the employee status to 'inactive' (false)
    const { data, error } = await supabaseAdmin
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
    const { error: moduleError } = await supabaseAdmin
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
    const { error: moduleError } = await supabaseAdmin
      .from('employee_modules')
      .delete()
      .eq('employee_id', id);

    if (moduleError) {
      console.error("Error deleting employee module permissions:", moduleError);
      // Continue with employee deletion even if module deletion fails
    }

    // Then delete the employee
    const { error } = await supabaseAdmin
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
    
    const { data, error } = await supabaseAdmin
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
    
    const { data, error } = await supabaseAdmin
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
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get auth token from request header
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header present:", authHeader ? "Yes" : "No");
    
    // Log the raw request body for debugging
    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);
    
    // Parse the request body
    const body = JSON.parse(requestBody);
    console.log("Request body parsed successfully:", body);
    
    // Get the operation to perform
    const { operation } = body;
    console.log("Handling operation:", operation);
    
    let result;
    
    // Handle different operations
    switch (operation) {
      case 'create':
        console.log("Employee data received:", body.employee);
        console.log("Creating employee:", body.employee);
        result = await createEmployee(body.employee);
        break;
      case 'update':
        result = await updateEmployee(body.employee);
        break;
      case 'get':
        result = await getEmployee(body.id);
        break;
      case 'list':
        result = await listEmployees(body.clientId);
        break;
      case 'add_module_access':
        result = (body.employee && body.employee.moduleAccessPayload && body.employee.id)
          ? await addEmployeeModuleAccess(body.employee.moduleAccessPayload, body.employee.id)
          : { error: 'Module access payload and employee ID are required' };
        break;
      case 'bulk_import':
        result = await handleBulkImport(body.employees);
        break;
      case 'deactivate':
        result = await deactivateEmployee(body.id);
        break;
      case 'delete':
        result = await deleteEmployee(body.id);
        break;
      default:
        result = { error: `Unknown operation: ${operation}`, success: false };
    }
    
    // Return the result
    return new Response(
      JSON.stringify(result), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred', 
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
