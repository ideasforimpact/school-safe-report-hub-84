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
  access_level?: {
    is_admin?: boolean;
    [key: string]: any;
  };
  is_admin?: boolean;
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

// Function to validate client exists and is active
async function validateClient(clientId: string | undefined): Promise<{ valid: boolean; message: string }> {
  try {
    if (!clientId) {
      return { valid: false, message: 'Client ID is required' };
    }
    
    console.log(`Validating client with ID: ${clientId}`);
    
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, active')
      .eq('id', clientId)
      .single();
      
    if (error) {
      console.error("Error validating client:", error);
      return { valid: false, message: 'Failed to validate client' };
    }
    
    if (!client) {
      return { valid: false, message: 'Client not found' };
    }
    
    if (!client.active) {
      return { valid: false, message: 'Client is not active' };
    }
    
    return { valid: true, message: 'Client is valid' };
  } catch (error) {
    console.error("Exception in validateClient:", error);
    return { valid: false, message: 'Error validating client' };
  }
}

// Function to check if an email already exists for a client
async function checkForExistingEmail(
  email: string, 
  clientId: string | undefined, 
  currentEmployeeId?: string
): Promise<boolean> {
  try {
    // Validate that client_id is provided
    if (!clientId) {
      console.error("Missing client ID in checkForExistingEmail function");
      // Consider this an error case - we can't properly check without a client ID
      return true; // Return true (as if duplicate exists) to prevent creation without proper client validation
    }
    
    console.log(`Checking for existing email ${email} for client ${clientId}`);
    
    // Build query - always filter by both email AND client_id
    let query = supabaseAdmin
      .from('employees')
      .select('id, email, client_id')
      .eq('email', email)
      .eq('client_id', clientId);
    
    // Exclude current employee if updating
    if (currentEmployeeId) {
      query = query.neq('id', currentEmployeeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking for existing email:", error);
      return false; // Assume no duplicate if error (will be caught elsewhere)
    }
    
    // If data exists and has length, then there's a duplicate within this client
    const isDuplicate = data && data.length > 0;
    console.log(`Email ${email} exists for client ${clientId}: ${isDuplicate}`);
    
    return isDuplicate;
  } catch (error) {
    console.error("Exception checking for existing email:", error);
    return false;
  }
}

// Improved function to add or update module access for an employee
async function addEmployeeModuleAccess(
  moduleAccessItems: ModuleAccessItem[], 
  employeeId: string,
  clientId: string | null | undefined
): Promise<void> {
  try {
    if (!moduleAccessItems || moduleAccessItems.length === 0) {
      console.log("No module access items to add");
      return;
    }
    
    // Validate employee belongs to the client
    if (clientId) {
      const { data: employee, error: employeeError } = await supabaseAdmin
        .from('employees')
        .select('id, client_id')
        .eq('id', employeeId)
        .single();
        
      if (employeeError || !employee) {
        console.error("Error validating employee:", employeeError);
        throw new Error("Failed to validate employee");
      }
      
      if (employee.client_id !== clientId) {
        console.error(`Employee ${employeeId} does not belong to client ${clientId}`);
        throw new Error("Employee does not belong to this client");
      }
    }
    
    // Fetch existing module access entries for this employee
    const { data: existingModules, error: fetchError } = await supabaseAdmin
      .from('employee_modules')
      .select('id, module_id, access_level')
      .eq('employee_id', employeeId);
    
    if (fetchError) {
      console.error("Error fetching existing module access:", fetchError);
      throw fetchError;
    }
    
    // Create a map of existing module entries by module_id for easy lookup
    const existingModuleMap = new Map();
    if (existingModules) {
      existingModules.forEach(module => {
        existingModuleMap.set(module.module_id, module);
      });
    }
    
    console.log(`Found ${existingModuleMap.size} existing module entries for employee ${employeeId}`);
    
    // Process each module access item
    for (const item of moduleAccessItems) {
      // Get module_id from either the directly provided module_id or the key
      const moduleId = item.module_id || item.key;
      
      // Process access_level properly
      let accessLevel = {};
      
      // Check if access_level already exists in the item
      if (item.access_level) {
        accessLevel = item.access_level;
      } 
      // If is_admin is directly on the item, move it to access_level
      else if (item.hasOwnProperty('is_admin')) {
        accessLevel = { is_admin: item.is_admin, isAdmin: item.is_admin, isEnabled: true };
      } else {
        // Default values if neither is provided
        accessLevel = { is_admin: false, isAdmin: false, isEnabled: true };
      }
      
      // Check if this module already exists for this employee
      if (existingModuleMap.has(moduleId)) {
        // Update existing entry
        const existingModule = existingModuleMap.get(moduleId);
        console.log(`Updating existing module entry for module ${moduleId} with access level:`, accessLevel);
        
        const { error: updateError } = await supabaseAdmin
          .from('employee_modules')
          .update({
            access_level: accessLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingModule.id);
        
        if (updateError) {
          console.error(`Error updating module entry for module ${moduleId}:`, updateError);
          throw updateError;
        }
        
        // Remove from map to track which ones were processed
        existingModuleMap.delete(moduleId);
      } else {
        // Insert new entry
        console.log(`Creating new module entry for module ${moduleId} with access level:`, accessLevel);
        
        const { error: insertError } = await supabaseAdmin
          .from('employee_modules')
          .insert({
            employee_id: employeeId,
            module_id: moduleId,
            access_level: accessLevel
          });
        
        if (insertError) {
          console.error(`Error inserting module entry for module ${moduleId}:`, insertError);
          throw insertError;
        }
      }
      
      console.log(`Successfully processed module access for module ${moduleId} to employee ${employeeId}`);
    }
    
    console.log(`Successfully completed processing module access entries for employee: ${employeeId}`);
    console.log("Module access updated successfully");
  } catch (error) {
    console.error("Error adding/updating employee module access:", error);
    throw error;
  }
}

// Function to delete all module access for an employee - kept for backward compatibility
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
    // Validate client_id
    if (!employee.clientId) {
      return { 
        error: 'Client ID is required', 
        code: 'MISSING_CLIENT_ID',
        success: false 
      };
    }
    
    // Validate client exists and is active
    const clientValidation = await validateClient(employee.clientId);
    if (!clientValidation.valid) {
      return {
        error: clientValidation.message,
        code: 'INVALID_CLIENT',
        success: false
      };
    }
    
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
      await addEmployeeModuleAccess(employee.moduleAccessPayload, newEmployee.id, employee.clientId);
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
    let clientId: string | null = null;
    
    if (typeof employeeData === 'string') {
      // Direct ID string
      employeeId = employeeData;
      console.log(`Found ID directly in employeeData: ${employeeId}`);
    } else if (employeeData && typeof employeeData === 'object') {
      // ID within an object
      employeeId = employeeData.id;
      clientId = employeeData.clientId;
      console.log(`Found ID in employeeData.id: ${employeeId}`);
      console.log(`Found clientId in employeeData.clientId: ${clientId}`);
    }
    
    if (!employeeId) {
      console.error("Missing employee ID for operation:", operation);
      return { error: 'Employee ID is required for this operation' };
    }
    
    // If clientId is provided, validate it
    if (clientId) {
      const clientValidation = await validateClient(clientId);
      if (!clientValidation.valid) {
        return {
          error: clientValidation.message,
          code: 'INVALID_CLIENT',
          success: false
        };
      }
    }
    
    if (operation === 'deactivate') {
      return await deactivateEmployee(employeeId, clientId);
    } else if (operation === 'delete') {
      return await deleteEmployee(employeeId, clientId);
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
        ? await addEmployeeModuleAccess(employeeData.moduleAccessPayload, employeeData.id, employeeData.clientId)
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
        // Validate client_id
        if (!employee.clientId) {
          results.errors.push(`Missing client ID for employee ${employee.email}`);
          continue;
        }
        
        // Validate client exists and is active
        const clientValidation = await validateClient(employee.clientId);
        if (!clientValidation.valid) {
          results.errors.push(`${clientValidation.message} for employee ${employee.email}`);
          continue;
        }
        
        // Check if employee with same email already exists for this client
        if (employee.email && employee.clientId) {
          // Using the enhanced checkForExistingEmail function that checks within the same client
          const emailExists = await checkForExistingEmail(employee.email, employee.clientId);
          
          if (emailExists) {
            // Email exists for this client - update the employee
            console.log(`Updating existing employee with email ${employee.email} for client ${employee.clientId}`);
            
            // Get the existing employee first
            const { data: existingEmployee, error: fetchError } = await supabaseAdmin
              .from('employees')
              .select('id')
              .eq('email', employee.email)
              .eq('client_id', employee.clientId)
              .single();
              
            if (fetchError || !existingEmployee) {
              throw new Error(`Error fetching existing employee: ${fetchError?.message || 'Employee not found'}`);
            }
            
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
              await addEmployeeModuleAccess(employee.moduleAccessPayload, existingEmployee.id, employee.clientId);
            }
            
            results.updated++;
            results.employees.push(updatedEmp);
            
          } else {
            // Employee doesn't exist for this client - create new one
            console.log(`Creating new employee with email ${employee.email} for client ${employee.clientId}`);
            
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
              await addEmployeeModuleAccess(employee.moduleAccessPayload, newEmployee.id, employee.clientId);
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

// Improved updateEmployee function with fixed module access handling
async function updateEmployee(employee: any) {
  try {
    if (!employee || !employee.id) {
      return { error: "Employee ID is required for update operation" };
    }
    
    // First, get the current employee details to validate client relationship
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('id, client_id')
      .eq('id', employee.id)
      .single();
      
    if (fetchError) {
      console.error("Error fetching employee data:", fetchError);
      return { error: "Error fetching employee data", success: false };
    }
    
    if (!existingEmployee) {
      return { error: "Employee not found", success: false };
    }
    
    // Use clientId from the employee data or the existing record
    const clientId = employee.clientId || existingEmployee.client_id;
    
    if (!clientId) {
      return { error: "Client ID is required for update", success: false };
    }
    
    // Validate the client
    const clientValidation = await validateClient(clientId);
    if (!clientValidation.valid) {
      return {
        error: clientValidation.message,
        code: 'INVALID_CLIENT',
        success: false
      };
    }
    
    // Verify employee belongs to this client
    if (existingEmployee.client_id !== clientId) {
      return { 
        error: "Employee does not belong to this client", 
        code: "CLIENT_MISMATCH",
        success: false 
      };
    }
    
    console.log(`Updating employee with ID: ${employee.id} for client: ${clientId}`);
    
    // Check for email uniqueness within this client
    if (employee.email) {
      const emailExists = await checkForExistingEmail(
        employee.email, 
        clientId, 
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
    
    // Handle module access updates using the improved function
    if (employee.moduleAccessPayload) {
      try {
        // Process module access payload to ensure consistent format
        const processedModuleAccess = employee.moduleAccessPayload.map((item: any) => {
          // Start with a copy of the item
          const processedItem = { ...item };
          
          // If access_level is not provided, create it 
          if (!processedItem.access_level) {
            processedItem.access_level = {};
          }
          
          // If item has is_admin property directly, add it to access_level
          if (item.hasOwnProperty('is_admin')) {
            processedItem.access_level.is_admin = item.is_admin;
            processedItem.access_level.isAdmin = item.is_admin;
          }
          
          // Ensure isEnabled is set
          processedItem.access_level.isEnabled = true;
          
          return processedItem;
        });
        
        console.log("Processed module access payload:", processedModuleAccess);
        
        // Use the improved function to handle module access with processed payload
        await addEmployeeModuleAccess(processedModuleAccess, employee.id, clientId);
        console.log("Module access updated successfully");
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

async function deactivateEmployee(id: string, clientId?: string | null) {
  try {
    console.log(`Deactivating employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required for deactivation" };
    }
    
    // If clientId is not provided, get it from the employee record
    if (!clientId) {
      const { data: employee, error: fetchError } = await supabaseAdmin
        .from('employees')
        .select('client_id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching employee client_id:", fetchError);
        return { error: "Error fetching employee data", success: false };
      }
      
      clientId = employee?.client_id;
    }
    
    // Validate client exists and is active
    if (clientId) {
      const clientValidation = await validateClient(clientId);
      if (!clientValidation.valid) {
        return {
          error: clientValidation.message,
          code: 'INVALID_CLIENT',
          success: false
        };
      }
    } else {
      return { error: "Client ID is required for deactivation", success: false };
    }
    
    // First update the employee status to 'inactive' (false)
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update({ status: false })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('*')
      .single();
      
    if (error) {
      console.error("Error deactivating employee:", error);
      return { error: error.message, success: false };
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
        warning: "Employee deactivated but module permissions could not be removed",
        success: true
      };
    }
    
    return { data, message: "Employee deactivated successfully", success: true };
  } catch (error) {
    console.error("Error in deactivateEmployee:", error);
    return { error: error.message || "Failed to deactivate employee", success: false };
  }
}

async function deleteEmployee(id: string, clientId?: string | null) {
  try {
    console.log(`Deleting employee with ID: ${id}`);
    
    if (!id) {
      return { error: "Employee ID is required for deletion" };
    }
    
    // If clientId is not provided, get it from the employee record
    if (!clientId) {
      const { data: employee, error: fetchError } = await supabaseAdmin
        .from('employees')
        .select('client_id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching employee client_id:", fetchError);
        return { error: "Error fetching employee data", success: false };
      }
      
      clientId = employee?.client_id;
    }
    
    // Validate client exists and is active
    if (clientId) {
      const clientValidation = await validateClient(clientId);
      if (!clientValidation.valid) {
        return {
          error: clientValidation.message,
          code: 'INVALID_CLIENT',
          success: false
        };
      }
    } else {
      return { error: "Client ID is required for deletion", success: false };
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
      .eq('id', id)
      .eq('client_id', clientId);

    if (error) {
      console.error("Error deleting employee:", error);
      return { error: error.message || "Failed to delete employee", success: false };
    }

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return { error: error.message || "Failed to delete employee", success: false };
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
    
    // Validate client exists and is active
    if (data.client_id) {
      const clientValidation = await validateClient(data.client_id);
      if (!clientValidation.valid) {
        return {
          error: clientValidation.message,
          code: 'INVALID_CLIENT',
          success: false
        };
      }
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
    
    // Validate client exists and is active
    const clientValidation = await validateClient(clientId);
    if (!clientValidation.valid) {
      return {
        error: clientValidation.message,
        code: 'INVALID_CLIENT',
        success: false
      };
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
          ? await addEmployeeModuleAccess(body.employee.moduleAccessPayload, body.employee.id, body.employee.clientId)
          : { error: 'Module access payload and employee ID are required' };
        break;
      case 'bulk_import':
        result = await handleBulkImport(body.employees);
        break;
      case 'deactivate':
        result = await deactivateEmployee(body.id, body.clientId);
        break;
      case 'delete':
        result = await deleteEmployee(body.id, body.clientId);
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
