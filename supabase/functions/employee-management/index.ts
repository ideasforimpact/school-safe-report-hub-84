
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

interface ModulePermissions {
  superAdmin: boolean;
  incidentReporting: boolean;
  incidentAdmin: boolean;
  assessmentUser: boolean;
  assessmentsAdmin: boolean;
  employeeVerificationAdmin: boolean;
  grievancesAdmin: boolean;
  transportSafetyAdmin: boolean;
  eduSafeResourceAccess: boolean;
}

interface Employee {
  id?: string;
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: string;
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
      if (operation === 'employees') {
        // Get all employees
        const { data, error } = await supabase
          .from('employees')
          .select('*');

        if (error) throw error;

        return new Response(JSON.stringify({ employees: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'employee') {
        // Get employee by ID - Now using body instead of query params
        const requestData = await req.json().catch(() => ({}));
        const id = requestData.id;
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ employee: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      }
    } else if (req.method === 'POST') {
      const requestData = await req.json();

      if (operation === 'create') {
        // Create a new employee
        const employeeData: Employee = requestData.employee;

        // Validate required fields
        if (!employeeData.employeeId || !employeeData.firstName || !employeeData.lastName || !employeeData.email || 
            !employeeData.employeeType || !employeeData.department || !employeeData.status) {
          return new Response(JSON.stringify({ error: 'Missing required employee fields' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Check if employee with same employeeId or email exists
        const { data: existingEmployee, error: checkError } = await supabase
          .from('employees')
          .select('id')
          .or(`email.eq.${employeeData.email},employee_id.eq.${employeeData.employeeId}`)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingEmployee) {
          return new Response(JSON.stringify({ error: 'An employee with this ID or email already exists' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 409,
          });
        }

        // Set timestamps
        const now = new Date().toISOString();

        // Insert employee - database structure updated, adapted fields
        const { data, error } = await supabase
          .from('employees')
          .insert([{
            employee_id: employeeData.employeeId,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            email: employeeData.email,
            employee_type: employeeData.employeeType,
            department: employeeData.department,
            joining_date: employeeData.joiningDate,
            status: employeeData.status,
            user_id: employeeData.userId,
            created_at: now,
            updated_at: now
          }])
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ employee: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201,
        });
      } else if (operation === 'update') {
        // Update an existing employee
        const { id, ...updates } = requestData.employee;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Check if employee exists
        const { data: existingEmployee, error: checkError } = await supabase
          .from('employees')
          .select('id')
          .eq('id', id)
          .single();

        if (checkError) {
          return new Response(JSON.stringify({ error: 'Employee not found' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 404,
          });
        }

        // Check if updating to an email or employeeId that already exists
        if (updates.email || updates.employeeId) {
          const orConditions = [];
          if (updates.email) orConditions.push(`email.eq.${updates.email}`);
          if (updates.employeeId) orConditions.push(`employee_id.eq.${updates.employeeId}`);
          
          if (orConditions.length > 0) {
            const { data: duplicateCheck, error: dupError } = await supabase
              .from('employees')
              .select('id')
              .or(orConditions.join(','))
              .neq('id', id)
              .maybeSingle();

            if (dupError) throw dupError;

            if (duplicateCheck) {
              return new Response(JSON.stringify({ error: 'Another employee with this ID or email already exists' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
                status: 409,
              });
            }
          }
        }

        // Update timestamp and adapt field names for database schema
        const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
        
        // Map camelCase properties to snake_case for database
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
        if (updates.employeeType !== undefined) dbUpdates.employee_type = updates.employeeType;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.joiningDate !== undefined) dbUpdates.joining_date = updates.joiningDate;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;

        // Update employee with adapted field names
        const { data, error } = await supabase
          .from('employees')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // If the employee is being deactivated, remove all module permissions
        if (updates.status === 'inactive') {
          console.log("Employee deactivated, removing all module permissions");
          const { error: moduleError } = await supabase
            .from('employee_modules')
            .delete()
            .eq('employee_id', id);
          
          if (moduleError) {
            console.error("Error removing module permissions for deactivated employee:", moduleError);
          } else {
            console.log("Successfully removed all module permissions for deactivated employee");
          }
        }

        return new Response(JSON.stringify({ employee: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'delete') {
        // Delete an employee
        const { id } = requestData;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // First remove all module permissions
        const { error: moduleError } = await supabase
          .from('employee_modules')
          .delete()
          .eq('employee_id', id);
          
        if (moduleError) {
          console.error("Error deleting employee module permissions:", moduleError);
        }

        // Delete employee
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'update-permissions') {
        // Update module permissions
        const { employeeId, modulePermissions } = requestData;

        if (!employeeId) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Check if employee is active before allowing permission changes
        const { data: employeeData, error: employeeCheckError } = await supabase
          .from('employees')
          .select('status')
          .eq('id', employeeId)
          .single();
          
        if (employeeCheckError) {
          return new Response(JSON.stringify({ error: 'Failed to verify employee status' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
        
        if (employeeData.status !== 'active') {
          return new Response(JSON.stringify({ error: 'Cannot modify permissions for inactive employees' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // First get all available modules to map permission keys to module IDs
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, key');

        if (modulesError) throw modulesError;

        // Create a map of module keys to IDs
        const moduleKeyToId: Record<string, string> = {};
        modules.forEach((module: any) => {
          moduleKeyToId[module.key] = module.id;
        });

        // Delete existing module permissions
        const { error: deleteError } = await supabase
          .from('employee_modules')
          .delete()
          .eq('employee_id', employeeId);

        if (deleteError) throw deleteError;

        // Add new module permissions
        const modulesToAdd = [];
        for (const [key, value] of Object.entries(modulePermissions)) {
          if (value && moduleKeyToId[key]) {
            modulesToAdd.push({
              employee_id: employeeId,
              module_id: moduleKeyToId[key]
            });
          }
        }

        if (modulesToAdd.length > 0) {
          const { data, error: insertError } = await supabase
            .from('employee_modules')
            .insert(modulesToAdd)
            .select();

          if (insertError) throw insertError;

          return new Response(JSON.stringify({ permissions: data }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          });
        }

        return new Response(JSON.stringify({ permissions: [] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'deactivate') {
        // Deactivate an employee (special endpoint for this specific operation)
        const { id } = requestData;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Update the employee status to inactive
        const { data, error } = await supabase
          .from('employees')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;

        // Remove all module permissions for deactivated employee
        const { error: moduleError } = await supabase
          .from('employee_modules')
          .delete()
          .eq('employee_id', id);
          
        if (moduleError) {
          console.error("Error removing module permissions for deactivated employee:", moduleError);
        }

        return new Response(JSON.stringify({ employee: data }), {
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
    console.error('Error in employee-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
