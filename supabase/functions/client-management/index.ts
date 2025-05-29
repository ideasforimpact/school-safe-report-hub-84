import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ClientData {
  id?: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  active: boolean;
  logo?: string;
  institution_type?: string;
  client_type_id?: string;
  allowed_domains?: string;
  super_admin_allowed_domain?: string;
  auth_providers?: string;
  moduleAccess?: Record<string, boolean>;
  superAdminEmail?: string;
  clientTypeId?: string;
}

interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

// Check if super admin email domain is allowed
function isSuperAdminEmailDomainAllowed(email: string, allowedDomains: string | null): boolean {
  if (!email || !allowedDomains) return true; // If no restrictions, allow all
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;
  
  const domainsArray = allowedDomains.split(',');
  return domainsArray.some(domain => domain.toLowerCase() === emailDomain);
}

async function createEmployeeFromSuperAdminEmail(clientId: string, superAdminEmail: string) {
  try {
    // Extract employee_id from the email (part before @ symbol)
    const employeeId = superAdminEmail.split('@')[0];
    
    // Create the employee record
    const employeeData = {
      employee_id: employeeId,
      first_name: employeeId, // Using the part before @ as first name
      last_name: '', // Empty last name
      email: superAdminEmail,
      department: 'Admin',
      employee_type: 'permanent',
      status: true,
      is_super_admin: true,
      client_id: clientId,
      joining_date: new Date().toISOString()
    };

    // Check if employee already exists with this email and client_id
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', superAdminEmail)
      .eq('client_id', clientId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing employee:', checkError);
      return null;
    }

    // If employee exists, return the existing record
    if (existingEmployee) {
      console.log('Employee already exists for this client:', existingEmployee);
      return existingEmployee;
    }

    // Insert new employee
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating employee from super admin email:", error);
      return null;
    }

    console.log('Created new super admin employee:', data);
    return data;
  } catch (err) {
    console.error('Error in createEmployeeFromSuperAdminEmail:', err);
    return null;
  }
}

// Helper function to update super admin employee
async function updateSuperAdminEmployee(clientId: string, superAdminEmail: string) {
  try {
    // Check if a super admin employee already exists for this client
    const { data: existingEmployee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_super_admin', true)
      .single();

    if (empError) {
      if (empError.code === 'PGRST116') {
        // No super admin exists, create one
        return await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
      }
      console.error('Error checking for existing employee:', empError);
      return null;
    }
    
    // Update existing employee if email changed
    if (existingEmployee.email !== superAdminEmail) {
      const employeeId = superAdminEmail.split('@')[0];
      const { data, error } = await supabase
        .from('employees')
        .update({
          email: superAdminEmail,
          employee_id: employeeId,
          first_name: employeeId
        })
        .eq('id', existingEmployee.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee email:', error);
        return null;
      }
      return data;
    }
    
    return existingEmployee;
  } catch (err) {
    console.error('Error in updateSuperAdminEmployee:', err);
    return null;
  }
}

// Helper function to delete all super admin employees for a client
async function deleteClientEmployees(clientId: string) {
  try {
    // First delete all module permissions for these employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('client_id', clientId);
      
    if (employees && employees.length > 0) {
      const employeeIds = employees.map(emp => emp.id);
      
      // Delete employee module permissions
      const { error: moduleError } = await supabase
        .from('employee_modules')
        .delete()
        .in('employee_id', employeeIds);
        
      if (moduleError) {
        console.error('Error deleting employee module permissions:', moduleError);
      }
    }
    
    // Then delete the employees
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('client_id', clientId);
      
    if (deleteError) {
      console.error('Error deleting client employees:', deleteError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in deleteClientEmployees:', err);
    return false;
  }
}

// Function to process module access based on the provided module information
async function processModuleAccess(clientId: string, moduleInfoArray: ModuleInfo[]): Promise<boolean> {
  try {
    console.log(`Processing modules for client ${clientId}:`, JSON.stringify(moduleInfoArray, null, 2));
    
    if (!moduleInfoArray || moduleInfoArray.length === 0) {
      console.log('No modules to process');
      return true;
    }

    // First, remove all existing modules for this client
    const { error: deleteError } = await supabase
      .from('client_modules')
      .delete()
      .eq('client_id', clientId);
      
    if (deleteError) {
      console.error(`Error deleting existing modules for client ${clientId}:`, deleteError);
      // Continue anyway to try adding new modules
    } else {
      console.log(`Successfully deleted existing modules for client ${clientId}`);
    }

    // For each module in the array, insert a new record
    for (const moduleInfo of moduleInfoArray) {
      const { module_id, is_admin } = moduleInfo;
      
      if (!module_id) {
        console.error('Missing module_id in module info');
        continue;
      }
      
      console.log(`Processing module: ${moduleInfo.name}, module_id: ${module_id}, is_admin: ${is_admin}`);
      
      const accessLevel = { 
        isAdmin: is_admin,
        isEnabled: true
      };
      
      // Insert new module
      console.log(`Inserting new module: ${module_id} with access_level:`, accessLevel);
      
      const { error: insertError } = await supabase
        .from('client_modules')
        .insert({
          client_id: clientId,
          module_id: module_id,
          access_level: accessLevel,
          enabled: true
        });
        
      if (insertError) {
        console.error(`Error inserting module ${module_id} for client ${clientId}:`, insertError);
        return false;
      } else {
        console.log(`Successfully inserted module ${module_id} for client ${clientId}`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error in processModuleAccess:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { operation, client } = await req.json()
    console.log('Client management operation:', operation, 'Client data:', client)

    switch (operation) {
      case 'create':
        return await handleCreateClient(client)
      case 'update':
        return await handleUpdateClient(client)
      case 'delete':
        return await handleDeleteClient(client)
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error('Error in client-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleCreateClient(clientData: any) {
  console.log('Creating client with data:', clientData);
  
  try {
    const { id: clientId, modules, superAdminEmail, clientTypeId } = clientData;
    
    // If client type is provided, update the client record
    if (clientTypeId) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ client_type_id: clientTypeId })
        .eq('id', clientId);
        
      if (updateError) {
        console.error('Error updating client type:', updateError);
      } else {
        console.log('Successfully updated client type');
      }
    }
    
    // Process module access
    if (modules && modules.length > 0) {
      const moduleSuccess = await processModuleAccess(clientId, modules);
      if (!moduleSuccess) {
        throw new Error('Failed to process module access');
      }
    }
    
    // Create super admin employee if email provided
    if (superAdminEmail) {
      const employee = await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
      if (!employee) {
        console.error('Failed to create super admin employee');
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleCreateClient:', error);
    throw error;
  }
}

async function handleUpdateClient(clientData: any) {
  console.log('Updating client with data:', clientData);
  
  try {
    const { id: clientId, modules, superAdminEmail, clientTypeId } = clientData;
    
    // If client type is provided, update the client record
    if (clientTypeId) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ client_type_id: clientTypeId })
        .eq('id', clientId);
        
      if (updateError) {
        console.error('Error updating client type:', updateError);
      } else {
        console.log('Successfully updated client type');
      }
    }
    
    // Process module access
    if (modules && modules.length > 0) {
      const moduleSuccess = await processModuleAccess(clientId, modules);
      if (!moduleSuccess) {
        throw new Error('Failed to process module access');
      }
    }
    
    // Update super admin employee if email provided
    if (superAdminEmail) {
      const employee = await updateSuperAdminEmployee(clientId, superAdminEmail);
      if (!employee) {
        console.error('Failed to update super admin employee');
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleUpdateClient:', error);
    throw error;
  }
}

async function handleDeleteClient(clientData: any) {
  console.log('Deleting client with data:', clientData);
  
  try {
    const { id: clientId } = clientData;
    
    // Delete client employees first
    const employeesDeleted = await deleteClientEmployees(clientId);
    if (!employeesDeleted) {
      console.error('Failed to delete client employees');
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleDeleteClient:', error);
    throw error;
  }
}
