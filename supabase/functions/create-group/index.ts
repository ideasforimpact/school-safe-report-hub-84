import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts'

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
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    )

    const rawBody = await req.text();
    const requestData = JSON.parse(rawBody);
    const { action, client_id, employee_id, name, description, group_type, group_id, employee_ids, department_id } = requestData;

    console.log("Request data:", { action, client_id, employee_id, name, description, group_type, group_id });

    // Validate required fields
    if (!action || !client_id || !employee_id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          details: "action, client_id, and employee_id are required"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate client exists
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid client ID",
          details: `Client with ID ${client_id} not found`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabaseClient,
      req,
      client_id,
      url.pathname
    );
    
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'create':
        return await handleCreate(supabaseClient, { client_id, employee_id, name, description, group_type, employee_ids, department_id });
      case 'update':
        return await handleUpdate(supabaseClient, { group_id, client_id, employee_id, name, description, group_type, employee_ids, department_id });
      case 'delete':
        return await handleDelete(supabaseClient, group_id, client_id);
      default:
        return new Response(
          JSON.stringify({ 
            error: "Invalid action",
            details: `Action '${action}' is not supported. Supported actions: create, update, delete`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error("Error in create-group function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCreate(supabaseClient: any, data: any) {
  const { client_id, employee_id, name, description, group_type, employee_ids, department_id } = data;

  // Validate required fields for create
  if (!name || !group_type) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required fields",
        details: "name and group_type are required"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Validate group_type
  if (group_type !== 'Department' && group_type !== 'Employee') {
    return new Response(
      JSON.stringify({ 
        error: "Invalid group_type",
        details: "group_type must be either 'Department' or 'Employee'"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Create the group
  const { data: group, error: groupError } = await supabaseClient
    .from('groups')
    .insert({
      name,
      description: description || null,
      group_type,
      client_id,
      employee_id,
      status: true
    })
    .select()
    .single();

  if (groupError || !group) {
    console.error("Error creating group:", groupError);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create group",
        details: groupError?.message || "Unknown error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Handle group_employees based on group_type
  if (group_type === 'Employee' && employee_ids && employee_ids.length > 0) {
    // Insert employee IDs directly
    const groupEmployees = employee_ids.map((empId: string) => ({
      group_id: group.id,
      employee_id: empId,
      role_id: null,
      client_id,
      created_by_employee_id: employee_id
    }));

    const { error: geError } = await supabaseClient
      .from('group_employees')
      .insert(groupEmployees);

    if (geError) {
      console.error("Error inserting group employees:", geError);
      // Rollback group creation
      await supabaseClient.from('groups').delete().eq('id', group.id);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create group employees",
          details: geError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } else if (group_type === 'Department' && department_id) {
    // Get all employees with this department
    const { data: employees, error: empError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('client_id', client_id)
      .eq('department', department_id)
      .eq('status', true);

    if (empError) {
      console.error("Error fetching employees by department:", empError);
      await supabaseClient.from('groups').delete().eq('id', group.id);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch employees",
          details: empError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (employees && employees.length > 0) {
      const groupEmployees = employees.map((emp: any) => ({
        group_id: group.id,
        employee_id: emp.id,
        role_id: department_id,
        client_id,
        created_by_employee_id: employee_id
      }));

      const { error: geError } = await supabaseClient
        .from('group_employees')
        .insert(groupEmployees);

      if (geError) {
        console.error("Error inserting group employees:", geError);
        await supabaseClient.from('groups').delete().eq('id', group.id);
        return new Response(
          JSON.stringify({ 
            error: "Failed to create group employees",
            details: geError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      data: group
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleUpdate(supabaseClient: any, data: any) {
  const { group_id, client_id, employee_id, name, description, group_type, employee_ids, department_id } = data;

  if (!group_id) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required field",
        details: "group_id is required for update"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Update the group
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (group_type) updateData.group_type = group_type;

  const { data: group, error: groupError } = await supabaseClient
    .from('groups')
    .update(updateData)
    .eq('id', group_id)
    .eq('client_id', client_id)
    .select()
    .single();

  if (groupError || !group) {
    console.error("Error updating group:", groupError);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update group",
        details: groupError?.message || "Unknown error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Handle group_employees updates
  if (group_type === 'Employee' && employee_ids && employee_ids.length > 0) {
    // Get existing employee IDs for this group
    const { data: existing, error: existingError } = await supabaseClient
      .from('group_employees')
      .select('employee_id')
      .eq('group_id', group_id);

    if (existingError) {
      console.error("Error fetching existing group employees:", existingError);
    } else {
      const existingIds = new Set(existing?.map((e: any) => e.employee_id) || []);
      const newIds = employee_ids.filter((id: string) => !existingIds.has(id));

      if (newIds.length > 0) {
        const groupEmployees = newIds.map((empId: string) => ({
          group_id: group_id,
          employee_id: empId,
          role_id: null,
          client_id,
          created_by_employee_id: employee_id
        }));

        const { error: geError } = await supabaseClient
          .from('group_employees')
          .insert(groupEmployees);

        if (geError) {
          console.error("Error inserting new group employees:", geError);
        }
      }
    }
  } else if (group_type === 'Department' && department_id) {
    // Get all employees with this department
    const { data: employees, error: empError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('client_id', client_id)
      .eq('department', department_id)
      .eq('status', true);

    if (empError) {
      console.error("Error fetching employees by department:", empError);
    } else if (employees && employees.length > 0) {
      // Get existing employee IDs for this group
      const { data: existing, error: existingError } = await supabaseClient
        .from('group_employees')
        .select('employee_id')
        .eq('group_id', group_id);

      if (existingError) {
        console.error("Error fetching existing group employees:", existingError);
      } else {
        const existingIds = new Set(existing?.map((e: any) => e.employee_id) || []);
        const newIds = employees
          .map((emp: any) => emp.id)
          .filter((id: string) => !existingIds.has(id));

        if (newIds.length > 0) {
          const groupEmployees = newIds.map((empId: string) => ({
            group_id: group_id,
            employee_id: empId,
            role_id: department_id,
            client_id,
            created_by_employee_id: employee_id
          }));

          const { error: geError } = await supabaseClient
            .from('group_employees')
            .insert(groupEmployees);

          if (geError) {
            console.error("Error inserting new group employees:", geError);
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      data: group
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleDelete(supabaseClient: any, group_id: string, client_id: string) {
  if (!group_id) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required field",
        details: "group_id is required for delete"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Delete group (cascade will handle group_employees)
  const { error: deleteError } = await supabaseClient
    .from('groups')
    .delete()
    .eq('id', group_id)
    .eq('client_id', client_id);

  if (deleteError) {
    console.error("Error deleting group:", deleteError);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete group",
        details: deleteError.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Group deleted successfully"
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

