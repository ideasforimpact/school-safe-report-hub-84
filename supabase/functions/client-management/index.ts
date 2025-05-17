
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
  auth_providers?: string;
  moduleAccess?: Record<string, boolean>;
  superAdminEmail?: string; // Added to handle super admin email
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the route to determine operation
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const operation = pathParts[pathParts.length - 1];

  try {
    // Process requests based on the operation
    if (req.method === 'GET') {
      if (operation === 'clients') {
        // Get all clients with their module access
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) throw clientsError;

        // Get all client_modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select('*');

        if (modulesError) throw modulesError;

        // Group modules by client
        const modulesByClient: Record<string, any[]> = {};
        modulesData?.forEach((module) => {
          if (!modulesByClient[module.client_id]) {
            modulesByClient[module.client_id] = [];
          }
          modulesByClient[module.client_id].push(module);
        });

        // Map clients with their modules
        const clientsWithModules = clientsData.map(client => {
          const clientModules = modulesByClient[client.id] || [];
          const moduleAccess: Record<string, boolean> = {};
          
          clientModules.forEach(module => {
            if (module.enabled) {
              moduleAccess[module.module_key] = true;
            }
          });
          
          return {
            ...client,
            moduleAccess
          };
        });

        return new Response(JSON.stringify({ clients: clientsWithModules }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'client') {
        // Get client by ID with module access
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Get client data
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (clientError) throw clientError;

        // Get client modules
        const { data: modules, error: modulesError } = await supabase
          .from('client_modules')
          .select('*')
          .eq('client_id', id);

        if (modulesError) throw modulesError;

        // Map modules to client
        const moduleAccess: Record<string, boolean> = {};
        modules?.forEach(module => {
          if (module.enabled) {
            moduleAccess[module.module_key] = true;
          }
        });

        return new Response(JSON.stringify({ 
          client: {
            ...client,
            moduleAccess
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      }
    } else if (req.method === 'POST') {
      const requestData = await req.json();

      if (operation === 'create') {
        // Create a new client with module access
        const clientData: ClientData = requestData.client;
        const moduleAccess = clientData.moduleAccess;
        const superAdminEmail = clientData.superAdminEmail; // Get the super admin email
        
        // Remove moduleAccess and superAdminEmail from client data before insertion
        const { moduleAccess: _, superAdminEmail: __, ...clientOnly } = clientData;

        // Insert client first
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([clientOnly])
          .select()
          .single();

        if (clientError) throw clientError;

        // Insert module access if provided
        if (moduleAccess && Object.keys(moduleAccess).length > 0) {
          const moduleInserts = Object.entries(moduleAccess)
            .filter(([_, enabled]) => enabled)
            .map(([key, _]) => ({
              client_id: newClient.id,
              module_key: key,
              enabled: true
            }));

          if (moduleInserts.length > 0) {
            const { error: moduleError } = await supabase
              .from('client_modules')
              .insert(moduleInserts);

            if (moduleError) {
              console.error('Error inserting client modules:', moduleError);
            }
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
            moduleAccess,
            superAdminEmail
          },
          employee
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201,
        });
      } else if (operation === 'update') {
        // Update an existing client with module access
        const { id, moduleAccess, superAdminEmail, ...clientUpdates } = requestData.client;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Update client data
        const { data: updatedClient, error: clientError } = await supabase
          .from('clients')
          .update(clientUpdates)
          .eq('id', id)
          .select()
          .single();

        if (clientError) throw clientError;

        // Update module access if provided
        if (moduleAccess) {
          // Delete existing modules
          const { error: deleteError } = await supabase
            .from('client_modules')
            .delete()
            .eq('client_id', id);

          if (deleteError) {
            console.error('Error deleting client modules:', deleteError);
          }

          // Insert new modules
          const moduleInserts = Object.entries(moduleAccess)
            .filter(([_, enabled]) => enabled)
            .map(([key, _]) => ({
              client_id: id,
              module_key: key,
              enabled: true
            }));

          if (moduleInserts.length > 0) {
            const { error: moduleError } = await supabase
              .from('client_modules')
              .insert(moduleInserts);

            if (moduleError) {
              console.error('Error inserting client modules:', moduleError);
            }
          }
        }

        // Handle super admin email update
        let employee = null;
        if (superAdminEmail) {
          // Check if a super admin employee already exists for this client
          const { data: existingEmployee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('client_id', id)
            .eq('is_super_admin', true)
            .single();

          if (empError && empError.code !== 'PGRST116') {
            console.error('Error checking for existing employee:', empError);
          } else if (existingEmployee) {
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
              } else {
                employee = data;
              }
            } else {
              employee = existingEmployee;
            }
          } else {
            // Create new super admin employee
            employee = await createEmployeeFromSuperAdminEmail(id, superAdminEmail);
          }
        }

        return new Response(JSON.stringify({ 
          client: {
            ...updatedClient,
            moduleAccess,
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

        // Delete client modules first (due to foreign key constraints)
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
      }
    }

    // If no matching operation is found
    return new Response(JSON.stringify({ error: 'Invalid operation' }), {
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
