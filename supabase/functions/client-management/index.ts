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
  allowed_domains?: string;
  super_admin_allowed_domain?: string;
  auth_providers?: string;
  moduleAccess?: Record<string, boolean>;
  superAdminEmail?: string;
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
          enabled: true,
          access_level: accessLevel
        });
        
      if (insertError) {
        console.error(`Error inserting module ${module_id}:`, insertError);
        continue;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error in processModuleAccess:', err);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Get the request data
    const requestData = req.method === 'POST' ? await req.json() : null;
    console.log(`Received ${req.method} request:`, JSON.stringify(requestData, null, 2));

    // Process requests based on the operation
    if (req.method === 'POST') {
      const operation = requestData.operation;
      console.log(`Processing operation: ${operation}`);

      if (operation === 'create') {
        // Process modules for a client that has already been created
        const clientId = requestData.client.id;
        const moduleInfoArray: ModuleInfo[] = requestData.client.modules || [];
        const superAdminEmail = requestData.client.superAdminEmail;
        
        console.log('Processing modules for client with ID:', clientId);
        console.log('Modules to process:', JSON.stringify(moduleInfoArray, null, 2));
        
        if (!clientId) {
          return new Response(JSON.stringify({ 
            error: 'Client ID is required' 
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Process module access if provided
        if (moduleInfoArray.length > 0) {
          const success = await processModuleAccess(clientId, moduleInfoArray);
          if (!success) {
            console.error('Failed to process module access');
          }
        }

        // Create employee from super admin email if provided
        let employee = null;
        if (superAdminEmail) {
          employee = await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
        }

        // Get the client data to return
        const { data: clientData, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching client data:', fetchError);
          throw fetchError;
        }

        return new Response(JSON.stringify({ 
          client: {
            ...clientData,
            moduleInfoArray,
            superAdminEmail
          },
          employee
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'update') {
        // Update an existing client with module access
        const { id, moduleAccess, superAdminEmail, modules: moduleInfoArray = [] } = requestData.client;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }
        
        console.log('Updating client modules:', JSON.stringify(moduleInfoArray, null, 2));
        
        // Get current client data to check super admin domain validation
        const { data: currentClient, error: fetchError } = await supabase
          .from('clients')
          .select('super_admin_allowed_domain')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching current client data:', fetchError);
        }

        // Validate super admin email domain if restrictions are set
        if (superAdminEmail && (requestData.client.super_admin_allowed_domain || 
            (currentClient && currentClient.super_admin_allowed_domain))) {
          const domains = requestData.client.super_admin_allowed_domain || 
            (currentClient ? currentClient.super_admin_allowed_domain : null);
            
          if (domains && !isSuperAdminEmailDomainAllowed(superAdminEmail, domains)) {
            return new Response(JSON.stringify({ 
              error: 'Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains.' 
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
              status: 400,
            });
          }
        }

        // Process modules if provided
        if (moduleInfoArray && moduleInfoArray.length > 0) {
          const success = await processModuleAccess(id, moduleInfoArray);
          if (!success) {
            console.error('Failed to process module access');
          }
        }

        // Handle super admin email update
        let employee = null;
        if (superAdminEmail) {
          employee = await updateSuperAdminEmployee(id, superAdminEmail);
        }

        // Get the updated client data
        const { data: updatedClient, error: clientFetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();
          
        if (clientFetchError) {
          console.error('Error fetching updated client data:', clientFetchError);
          throw clientFetchError;
        }

        return new Response(JSON.stringify({ 
          client: {
            ...updatedClient,
            moduleInfoArray,
            superAdminEmail
          },
          employee
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'delete') {
        // Delete a client and its module access
        const { id } = requestData;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Delete all client employees and their module permissions
        await deleteClientEmployees(id);

        // Delete client modules (due to foreign key constraints)
        const { error: moduleError } = await supabase
          .from('client_modules')
          .delete()
          .eq('client_id', id);

        if (moduleError) {
          console.error('Error deleting client modules:', moduleError);
        }

        // Delete client
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      }
    } else if (req.method === 'GET') {
      // Handle GET requests if needed
      return new Response(JSON.stringify({ message: "GET method not implemented" }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 501, // Not Implemented
      });
    }

    // If no matching operation is found
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
