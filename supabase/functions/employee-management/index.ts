
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

interface EmployeeApplicationFields {
  // Personal details
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  
  // Employment details
  position?: string;
  grade?: string;
  reportingManager?: string;
  workLocation?: string;
  
  // System access and Module permissions
  modulePermissions?: ModulePermissions;
  
  // Additional fields
  customFields?: Record<string, any>;
}

interface Employee {
  id?: string;
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: string;
  applicationFields?: EmployeeApplicationFields;
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
          .or(`email.eq.${employeeData.email},employeeId.eq.${employeeData.employeeId}`)
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
        employeeData.createdAt = now;
        employeeData.updatedAt = now;

        // Insert employee
        const { data, error } = await supabase
          .from('employees')
          .insert([employeeData])
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
          if (updates.employeeId) orConditions.push(`employeeId.eq.${updates.employeeId}`);
          
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

        // Update timestamp
        updates.updatedAt = new Date().toISOString();

        // Update employee
        const { data, error } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

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
        const { id, modulePermissions } = requestData;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        // Get existing employee data
        const { data: employee, error: fetchError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          return new Response(JSON.stringify({ error: 'Employee not found' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 404,
          });
        }

        // Update application fields with new module permissions
        const applicationFields = employee.applicationFields || {};
        const updatedApplicationFields = {
          ...applicationFields,
          modulePermissions: {
            ...applicationFields.modulePermissions || {
              superAdmin: false,
              incidentReporting: false,
              incidentAdmin: false,
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: false,
              eduSafeResourceAccess: false
            },
            ...modulePermissions
          }
        };

        // Update employee
        const { data, error } = await supabase
          .from('employees')
          .update({
            applicationFields: updatedApplicationFields,
            updatedAt: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

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
