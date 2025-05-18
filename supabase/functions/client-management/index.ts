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

// Updated Function to find a module by name
async function findModuleByName(moduleName: string): Promise<string | null> {
  try {
    console.log(`Searching for module with name: ${moduleName}`);
    
    // If module_id is already provided, just return it
    if (moduleName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.log(`Module ID already provided: ${moduleName}`);
      
      // Verify it exists in the database
      const { data: moduleExists, error: verifyError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', moduleName)
        .single();
        
      if (verifyError) {
        console.error(`Error verifying module ID ${moduleName}:`, verifyError);
        return null;
      }
      
      if (moduleExists) {
        console.log(`Verified module ID exists: ${moduleName}`);
        return moduleName;
      }
    }
    
    // First try exact name match
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, name')
      .eq('name', moduleName);
      
    if (error) {
      console.error(`Error finding module with name ${moduleName}:`, error);
      return null;
    }

    // If exact match found, return it
    if (modules && modules.length > 0) {
      console.log(`Found exact match for module ${moduleName}: ${modules[0].id}`);
      return modules[0].id;
    }
    
    // If no exact match, try case-insensitive search
    const { data: modulesIlike, error: ilikeError } = await supabase
      .from('modules')
      .select('id, name')
      .ilike('name', `%${moduleName}%`);
      
    if (ilikeError) {
      console.error(`Error in ilike search for module ${moduleName}:`, ilikeError);
      return null;
    }
    
    if (modulesIlike && modulesIlike.length > 0) {
      console.log(`Found fuzzy match for module ${moduleName}: ${modulesIlike[0].id} (${modulesIlike[0].name})`);
      return modulesIlike[0].id;
    }
    
    // Special case mappings
    const specialCaseMap: Record<string, string> = {
      'superAdmin': 'Dashboard',
      'incidentReporting': 'Incidents',
      'assessmentUser': 'Assessments',
      'employeeVerificationAdmin': 'Employee Verification',
      'grievancesAdmin': 'Grievances',
      'transportSafetyAdmin': 'Transport Safety',
      'eduSafeResourceAccess': 'EduSafe Resources'
    };
    
    // Try special case mapping
    const mappedName = specialCaseMap[moduleName];
    if (mappedName) {
      const { data: mappedModules, error: mappedError } = await supabase
        .from('modules')
        .select('id, name')
        .eq('name', mappedName);
        
      if (!mappedError && mappedModules && mappedModules.length > 0) {
        console.log(`Found mapped module for ${moduleName}: ${mappedModules[0].id} (${mappedModules[0].name})`);
        return mappedModules[0].id;
      }
    }

    // As last resort, get all modules and find the best match
    const { data: allModules, error: allModulesError } = await supabase
      .from('modules')
      .select('id, name');
      
    if (!allModulesError && allModules && allModules.length > 0) {
      console.log(`No direct match found for ${moduleName}, searching all ${allModules.length} modules`);
      for (const module of allModules) {
        console.log(`Checking module: ${module.name}`);
      }
    }

    console.log(`No module found with name: ${moduleName}`);
    return null;
  } catch (err) {
    console.error(`Error in findModuleByName for ${moduleName}:`, err);
    return null;
  }
}

// Updated Function to process module access data
async function processModuleAccess(clientId: string, moduleInfoArray: ModuleInfo[]): Promise<boolean> {
  try {
    console.log(`Processing modules for client ${clientId}:`, JSON.stringify(moduleInfoArray, null, 2));
    
    if (!moduleInfoArray || moduleInfoArray.length === 0) {
      console.log('No modules to process');
      return true;
    }
    
    // Delete existing client modules
    const { error: deleteError } = await supabase
      .from('client_modules')
      .delete()
      .eq('client_id', clientId);
      
    if (deleteError) {
      console.error('Error deleting existing client modules:', deleteError);
      return false;
    }
    
    // Process each module
    const moduleInserts = await Promise.all(moduleInfoArray.map(async (moduleInfo) => {
      // If module_id is not provided or empty, try to find it by name
      let moduleId = moduleInfo.module_id;
      if (!moduleId) {
        moduleId = await findModuleByName(moduleInfo.name);
        if (!moduleId) {
          console.log(`Could not find module ID for module named: ${moduleInfo.name}`);
          return null;
        }
      }
      
      console.log(`Creating client_module for: ${moduleInfo.name}, module_id: ${moduleId}, is_admin: ${moduleInfo.is_admin}`);
      
      // Create the client_module entry with proper access_level JSON
      return {
        client_id: clientId,
        module_id: moduleId,
        enabled: true,
        access_level: { 
          isAdmin: moduleInfo.is_admin,
          isEnabled: true
        }
      };
    }));
    
    // Filter out null entries and insert valid modules
    const validModuleInserts = moduleInserts.filter(item => item !== null);
    
    if (validModuleInserts.length > 0) {
      console.log(`Inserting ${validModuleInserts.length} client modules:`, JSON.stringify(validModuleInserts, null, 2));
      
      const { error: insertError } = await supabase
        .from('client_modules')
        .insert(validModuleInserts);
        
      if (insertError) {
        console.error('Error inserting client modules:', insertError);
        return false;
      }
      
      console.log(`Successfully inserted ${validModuleInserts.length} modules for client ${clientId}`);
      return true;
    }
    
    console.log('No valid modules to insert after processing');
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
        // Create a new client with module access
        const clientData: ClientData = requestData.client;
        const moduleInfoArray: ModuleInfo[] = requestData.client.modules || [];
        const superAdminEmail = clientData.superAdminEmail;
        
        console.log('Creating client with modules:', JSON.stringify(moduleInfoArray, null, 2));
        
        // Validate super admin email domain if restrictions are set
        if (superAdminEmail && clientData.super_admin_allowed_domain) {
          if (!isSuperAdminEmailDomainAllowed(superAdminEmail, clientData.super_admin_allowed_domain)) {
            return new Response(JSON.stringify({ 
              error: 'Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains.' 
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
              status: 400,
            });
          }
        }
        
        // Remove moduleAccess, superAdminEmail, and modules from client data before insertion
        const { moduleAccess: _, superAdminEmail: __, modules: ___, ...clientOnly } = clientData;

        // Insert client first
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([clientOnly])
          .select()
          .single();

        if (clientError) {
          console.error('Error creating client:', clientError);
          throw clientError;
        }

        // Process module access if provided
        if (moduleInfoArray.length > 0) {
          const success = await processModuleAccess(newClient.id, moduleInfoArray);
          if (!success) {
            console.error('Failed to process module access');
          }
        }

        // Create employee from super admin email if provided
        let employee = null;
        if (superAdminEmail) {
          employee = await createEmployeeFromSuperAdminEmail(newClient.id, superAdminEmail);
        }

        return new Response(JSON.stringify({ 
          client: {
            ...newClient,
            moduleInfoArray,
            superAdminEmail
          },
          employee
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201,
        });
      } else if (operation === 'update') {
        // Update an existing client with module access
        const { id, moduleAccess, superAdminEmail, modules: moduleInfoArray = [], ...clientUpdates } = requestData.client;

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
        if (superAdminEmail && (clientUpdates.super_admin_allowed_domain || 
            (currentClient && currentClient.super_admin_allowed_domain))) {
          const domains = clientUpdates.super_admin_allowed_domain || 
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

        // Update client data
        const { data: updatedClient, error: clientError } = await supabase
          .from('clients')
          .update(clientUpdates)
          .eq('id', id)
          .select()
          .single();

        if (clientError) {
          console.error('Error updating client:', clientError);
          throw clientError;
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
