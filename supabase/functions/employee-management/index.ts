
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Auth header present:", req.headers.get('Authorization') ? 'Yes' : 'No');

    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    const { operation, employee, id } = JSON.parse(rawBody);
    console.log("Request body parsed successfully:", { operation, employee, id });

    console.log("Handling operation:", operation);

    // Validate client exists for operations that need it
    if (operation === 'create' || operation === 'update') {
      if (!employee?.clientId && !employee?.client_id) {
        return new Response(
          JSON.stringify({ error: "Client ID is required" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const clientId = employee.clientId || employee.client_id;
      console.log("Validating client with ID:", clientId);

      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        console.error("Client validation error:", clientError);
        return new Response(
          JSON.stringify({ error: "Invalid client ID" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    switch (operation) {
      case 'create':
        return await handleCreate(supabaseClient, employee);
      case 'update':
        return await handleUpdate(supabaseClient, employee);
      case 'delete':
        return await handleDelete(supabaseClient, id);
      case 'deactivate':
        return await handleDeactivate(supabaseClient, id);
      case 'reactivate':
        return await handleReactivate(supabaseClient, id);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error("Error in employee-management function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCreate(supabaseClient: any, employee: any) {
  const clientId = employee.clientId || employee.client_id;
  
  // Check for duplicate email within the same client
  console.log("Checking for existing email", employee.email, "for client", clientId);
  const { data: existingEmployee, error: checkError } = await supabaseClient
    .from('employees')
    .select('id')
    .eq('email', employee.email)
    .eq('client_id', clientId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking for existing employee:", checkError);
    return new Response(
      JSON.stringify({ error: "Error checking for existing employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log("Email", employee.email, "exists for client", clientId + ":", !!existingEmployee);

  if (existingEmployee) {
    const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: "DUPLICATE_EMAIL"
      }),
      { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Create employee record
  const employeeData = {
    employee_id: employee.employeeId,
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    employee_type: employee.employeeType,
    department: employee.department,
    joining_date: employee.joiningDate,
    status: true,
    client_id: clientId,
    user_id: employee.user_id || null,
    is_super_admin: employee.is_super_admin || false
  };

  console.log("Creating employee with data:", employeeData);

  const { data: newEmployee, error: createError } = await supabaseClient
    .from('employees')
    .insert(employeeData)
    .select('*')
    .single();

  if (createError) {
    console.error("Error creating employee:", createError);
    if (createError.message.includes('duplicate') && createError.message.includes('email')) {
      const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: "DUPLICATE_EMAIL"
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log("Employee created successfully:", newEmployee);

  // Handle module access if provided
  if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload)) {
    await handleEmployeeModuleAccess(supabaseClient, newEmployee.id, employee.moduleAccessPayload);
  }

  return new Response(
    JSON.stringify({ data: newEmployee }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleUpdate(supabaseClient: any, employee: any) {
  const clientId = employee.clientId || employee.client_id;
  
  console.log("Updating employee with ID:", employee.id);

  // Check for duplicate email within the same client (excluding current employee)
  console.log("Checking for existing email", employee.email, "for client", clientId);
  const { data: existingEmployee, error: checkError } = await supabaseClient
    .from('employees')
    .select('id')
    .eq('email', employee.email)
    .eq('client_id', clientId)
    .neq('id', employee.id)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking for existing employee:", checkError);
    return new Response(
      JSON.stringify({ error: "Error checking for existing employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log("Email", employee.email, "exists for client", clientId + ":", !!existingEmployee);

  if (existingEmployee) {
    const errorMessage = `An employee with email ${employee.email} already exists for this client.`;
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: "DUPLICATE_EMAIL"
      }),
      { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Update employee record
  const updateData = {
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    employee_type: employee.employeeType,
    department: employee.department
  };

  console.log("Update data:", updateData);

  const { data: updatedEmployee, error: updateError } = await supabaseClient
    .from('employees')
    .update(updateData)
    .eq('id', employee.id)
    .select('*')
    .single();

  if (updateError) {
    console.error("Error updating employee:", updateError);
    return new Response(
      JSON.stringify({ error: "Failed to update employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log("Employee updated successfully:", updatedEmployee);

  // Handle module access update if provided
  if (employee.moduleAccessPayload && Array.isArray(employee.moduleAccessPayload)) {
    await handleEmployeeModuleAccess(supabaseClient, employee.id, employee.moduleAccessPayload);
  }

  return new Response(
    JSON.stringify({ data: updatedEmployee }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleEmployeeModuleAccess(supabaseClient: any, employeeId: string, moduleAccessPayload: any[]) {
  try {
    // First, delete all existing module access for this employee
    console.log("Deleting all module access for employee:", employeeId);
    const { error: deleteError } = await supabaseClient
      .from('employee_modules')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error("Error deleting existing module access:", deleteError);
      return;
    }

    console.log("Successfully deleted all module access for employee:", employeeId);

    // Prepare module entries for insertion
    const moduleEntries = moduleAccessPayload.map(moduleAccess => {
      // Extract is_admin from the access_level or level property
      let isAdmin = false;
      
      if (moduleAccess.access_level && typeof moduleAccess.access_level === 'object') {
        isAdmin = moduleAccess.access_level.is_admin === true;
      } else if (moduleAccess.level && typeof moduleAccess.level === 'object') {
        isAdmin = moduleAccess.level.is_admin === true;
      }

      return {
        employee_id: employeeId,
        module_id: moduleAccess.module_id,
        level: { is_admin: isAdmin }
      };
    });

    console.log("Adding module entries:", moduleEntries);

    // Insert new module access entries
    const { error: insertError } = await supabaseClient
      .from('employee_modules')
      .insert(moduleEntries);

    if (insertError) {
      console.error("Error inserting module entries:", insertError);
      console.error("Error adding employee module access:", insertError);
      return;
    }

    console.log("Successfully added module access for employee:", employeeId);
  } catch (error) {
    console.error("Error updating module access:", error);
  }
}

async function handleDelete(supabaseClient: any, employeeId: string) {
  console.log("Deleting employee with ID:", employeeId);

  // First, delete all module permissions for this employee
  const { error: moduleError } = await supabaseClient
    .from('employee_modules')
    .delete()
    .eq('employee_id', employeeId);

  if (moduleError) {
    console.error("Error deleting employee module permissions:", moduleError);
  }

  // Then delete the employee
  const { error: deleteError } = await supabaseClient
    .from('employees')
    .delete()
    .eq('id', employeeId);

  if (deleteError) {
    console.error("Error deleting employee:", deleteError);
    return new Response(
      JSON.stringify({ error: "Failed to delete employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleDeactivate(supabaseClient: any, employeeId: string) {
  console.log("Deactivating employee with ID:", employeeId);

  const { data: deactivatedEmployee, error: deactivateError } = await supabaseClient
    .from('employees')
    .update({ status: false })
    .eq('id', employeeId)
    .select('*')
    .single();

  if (deactivateError) {
    console.error("Error deactivating employee:", deactivateError);
    return new Response(
      JSON.stringify({ error: "Failed to deactivate employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Clear all module permissions for deactivated employee
  const { error: moduleError } = await supabaseClient
    .from('employee_modules')
    .delete()
    .eq('employee_id', employeeId);

  if (moduleError) {
    console.error("Error removing module permissions:", moduleError);
  }

  return new Response(
    JSON.stringify({ data: deactivatedEmployee }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleReactivate(supabaseClient: any, employeeId: string) {
  console.log("Reactivating employee with ID:", employeeId);

  const { data: reactivatedEmployee, error: reactivateError } = await supabaseClient
    .from('employees')
    .update({ status: true })
    .eq('id', employeeId)
    .select('*')
    .single();

  if (reactivateError) {
    console.error("Error reactivating employee:", reactivateError);
    return new Response(
      JSON.stringify({ error: "Failed to reactivate employee" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({ data: reactivatedEmployee }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
