import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Employee management function
async function handleEmployeeOperation(operation: string, employeeData: any) {
  console.log(`Handling operation: ${operation}`);
  
  switch (operation) {
    case 'create':
      return await createEmployee(employeeData);
    case 'update':
      return await updateEmployee(employeeData);
    case 'deactivate':
      return await deactivateEmployee(employeeData.id);
    case 'delete':
      return await deleteEmployee(employeeData.id);
    case 'get':
      return await getEmployee(employeeData.id);
    case 'list':
      return await listEmployees(employeeData.clientId);
    default:
      return { error: 'Invalid operation' };
  }
}

async function createEmployee(employee: any) {
  console.log("Creating employee:", employee);
  
  try {
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
    // For each module in the payload, find the module ID by name and insert into employee_modules
    const moduleInserts = await Promise.all(moduleAccess.map(async (module) => {
      // Get module ID from modules table by name
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('name', module.name)
        .single();
        
      if (moduleError || !moduleData) {
        console.log(`Module not found for name: ${module.name}`);
        return null;
      }
      
      // Insert into employee_modules
      const { data, error } = await supabase
        .from('employee_modules')
        .insert({
          employee_id: employeeId,
          module_id: moduleData.id,
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
  // Implementation for deactivating an employee
  return { error: 'Not implemented yet' };
}

async function deleteEmployee(id: string) {
  // Implementation for deleting an employee
  return { error: 'Not implemented yet' };
}

async function getEmployee(id: string) {
  // Implementation for getting an employee by ID
  return { error: 'Not implemented yet' };
}

async function listEmployees(clientId: string) {
  // Implementation for listing employees for a client
  return { error: 'Not implemented yet' };
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

    // Extract operation and employee data
    const { operation, employee } = reqBody;
    
    // Handle the employee operation
    const result = await handleEmployeeOperation(operation, employee);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
