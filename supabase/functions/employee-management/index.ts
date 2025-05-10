
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Employee Management Function Started");

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed to Supabase Edge Functions
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default when deployed to Supabase Edge Functions
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth header of the logged in user
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the request body and path parameter
    const requestUrl = new URL(req.url);
    const path = requestUrl.pathname.split("/").pop();

    console.log(`Request path: ${path}`);
    
    if (path === "bulk-update") {
      return await handleBulkUpdate(req, supabaseClient);
    } else if (path === "bulk-create") {
      return await handleBulkCreate(req, supabaseClient);
    }
    
    // Get the request body for standard operations
    const { operation, employee, id } = await req.json();

    // Handle different operations
    switch (operation) {
      case "create":
        return await handleCreate(supabaseClient, employee);

      case "update":
        if (!employee.id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for update" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        return await handleUpdate(supabaseClient, employee);

      case "delete":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for delete" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        return await handleDelete(supabaseClient, id);

      case "deactivate":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for deactivation" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        return await handleDeactivate(supabaseClient, id);

      default:
        return new Response(JSON.stringify({ error: "Invalid operation" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Handle bulk update of existing employees and creation of new employees
async function handleBulkUpdate(req, supabaseClient) {
  try {
    const { employees } = await req.json();
    
    if (!employees || !Array.isArray(employees)) {
      return new Response(JSON.stringify({ error: "Invalid request format. Expected 'employees' array." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Processing bulk update for ${employees.length} employees`);

    // Separate employees into those to update (have IDs) and those to create (don't have IDs)
    const toCreate = [];
    const toUpdate = [];
    const employeeIdMap = new Map();
    
    // Process employees to create or update
    for (const emp of employees) {
      if (emp.id) {
        // If ID exists, this is an update
        toUpdate.push({
          id: emp.id,
          first_name: emp.firstName,
          last_name: emp.lastName,
          email: emp.email,
          employee_id: emp.employeeId,
          employee_type: emp.employeeType,
          department: emp.department,
          joining_date: emp.joiningDate,
          status: emp.status || 'active'
        });
      } else {
        // Check if we have an employee with this employee_id already
        employeeIdMap.set(emp.employeeId.toLowerCase(), emp);
      }
    }
    
    // If there are potential new employees, check which ones already exist
    if (employeeIdMap.size > 0) {
      const employeeIds = Array.from(employeeIdMap.keys());
      
      // Check which employee IDs already exist
      const { data: existingEmployees, error: lookupError } = await supabaseClient
        .from("employees")
        .select("id, employee_id")
        .in("employee_id", employeeIds.map(id => id.toLowerCase()));
        
      if (lookupError) {
        throw lookupError;
      }
      
      // For existing employees, add them to update list with their database ID
      for (const existing of (existingEmployees || [])) {
        const empData = employeeIdMap.get(existing.employee_id.toLowerCase());
        if (empData) {
          toUpdate.push({
            id: existing.id,
            first_name: empData.firstName,
            last_name: empData.lastName,
            email: empData.email,
            employee_id: empData.employeeId,
            employee_type: empData.employeeType,
            department: empData.department,
            joining_date: empData.joiningDate,
            status: empData.status || 'active'
          });
          employeeIdMap.delete(existing.employee_id.toLowerCase());
        }
      }
      
      // Any remaining employees are truly new
      for (const [_, empData] of employeeIdMap.entries()) {
        toCreate.push({
          first_name: empData.firstName,
          last_name: empData.lastName,
          email: empData.email,
          employee_id: empData.employeeId,
          employee_type: empData.employeeType,
          department: empData.department,
          joining_date: empData.joiningDate,
          status: empData.status || 'active'
        });
      }
    }
    
    console.log(`Processing ${toCreate.length} new employees and ${toUpdate.length} existing employees`);
    
    const results = {
      created: [],
      updated: [],
      errors: []
    };
    
    // Create new employees in bulk if there are any
    if (toCreate.length > 0) {
      const { data: createdData, error: createError } = await supabaseClient
        .from("employees")
        .insert(toCreate)
        .select();
        
      if (createError) {
        console.error("Error creating employees:", createError);
        results.errors.push(`Bulk create error: ${createError.message}`);
      } else {
        results.created = createdData || [];
        console.log(`Successfully created ${results.created.length} employees`);
      }
    }
    
    // Update existing employees one by one (Supabase doesn't support bulk updates with different IDs)
    for (const emp of toUpdate) {
      const { id, ...updateData } = emp;
      const { data: updatedData, error: updateError } = await supabaseClient
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (updateError) {
        console.error(`Error updating employee ${id}:`, updateError);
        results.errors.push(`Update error for employee ${emp.employee_id}: ${updateError.message}`);
      } else if (updatedData) {
        results.updated.push(updatedData);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors,
        employees: [...results.created, ...results.updated]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in bulk update:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

// Handle bulk creation of employees
async function handleBulkCreate(req, supabaseClient) {
  try {
    const { employees } = await req.json();
    
    if (!employees || !Array.isArray(employees)) {
      return new Response(JSON.stringify({ error: "Invalid request format. Expected 'employees' array." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Processing bulk creation for ${employees.length} employees`);
    
    // Format employees for insertion
    const formattedEmployees = employees.map(emp => ({
      employee_id: emp.employeeId,
      first_name: emp.firstName,
      last_name: emp.lastName,
      email: emp.email,
      employee_type: emp.employeeType,
      department: emp.department,
      joining_date: emp.joiningDate,
      status: emp.status || 'active'
    }));
    
    // Insert all employees in a single operation
    const { data, error } = await supabaseClient
      .from("employees")
      .insert(formattedEmployees)
      .select();
      
    if (error) {
      console.error("Error creating employees in bulk:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        count: data.length,
        employees: data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in bulk create:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

// Create a new employee
async function handleCreate(supabaseClient, employeeData) {
  console.log("Creating employee:", employeeData);

  // Format the employee data for inserting into the database
  const dbEmployee = {
    employee_id: employeeData.employeeId,
    first_name: employeeData.firstName,
    last_name: employeeData.lastName,
    email: employeeData.email,
    employee_type: employeeData.employeeType,
    department: employeeData.department,
    joining_date: employeeData.joiningDate,
    status: employeeData.status || "active",
  };

  // Insert the new employee
  const { data: employee, error } = await supabaseClient
    .from("employees")
    .insert(dbEmployee)
    .select("*")
    .single();

  if (error) {
    console.error("Error creating employee:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // If module permissions were provided, update them as well
  if (employeeData.modulePermissions && employee) {
    await updateModulePermissions(supabaseClient, employee.id, employeeData.modulePermissions);
  }

  return new Response(JSON.stringify({ success: true, employee }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 201,
  });
}

// Update an existing employee
async function handleUpdate(supabaseClient, employeeData) {
  console.log("Updating employee:", employeeData);

  // Format the employee data for updating in the database
  const dbEmployee = {
    first_name: employeeData.firstName,
    last_name: employeeData.lastName,
    email: employeeData.email,
  };

  // Add optional fields if they exist
  if (employeeData.employeeType) dbEmployee.employee_type = employeeData.employeeType;
  if (employeeData.department) dbEmployee.department = employeeData.department;
  if (employeeData.joiningDate) dbEmployee.joining_date = employeeData.joiningDate;
  if (employeeData.status) dbEmployee.status = employeeData.status;
  
  // Update the employee record
  const { data: employee, error } = await supabaseClient
    .from("employees")
    .update(dbEmployee)
    .eq("id", employeeData.id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating employee:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // If module permissions were provided, update them as well
  if (employeeData.modulePermissions) {
    await updateModulePermissions(supabaseClient, employeeData.id, employeeData.modulePermissions);
  }

  return new Response(JSON.stringify({ success: true, employee }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Delete an employee
async function handleDelete(supabaseClient, employeeId) {
  console.log("Deleting employee:", employeeId);

  // First, delete all module permissions for this employee
  const { error: moduleError } = await supabaseClient
    .from("employee_modules")
    .delete()
    .eq("employee_id", employeeId);

  if (moduleError) {
    console.error("Error deleting employee module permissions:", moduleError);
    // Continue with employee deletion even if module deletion fails
  }

  // Delete the employee
  const { error } = await supabaseClient
    .from("employees")
    .delete()
    .eq("id", employeeId);

  if (error) {
    console.error("Error deleting employee:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Deactivate an employee (set status to inactive and remove module permissions)
async function handleDeactivate(supabaseClient, employeeId) {
  console.log("Deactivating employee:", employeeId);

  // First, delete all module permissions for this employee
  const { error: moduleError } = await supabaseClient
    .from("employee_modules")
    .delete()
    .eq("employee_id", employeeId);

  if (moduleError) {
    console.error("Error removing module permissions:", moduleError);
    // Continue with status update even if module deletion fails
  } else {
    console.log("Successfully removed all module permissions for deactivated employee");
  }

  // Update the employee status to inactive
  const { data: employee, error } = await supabaseClient
    .from("employees")
    .update({ status: "inactive" })
    .eq("id", employeeId)
    .select("*")
    .single();

  if (error) {
    console.error("Error deactivating employee:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true, employee }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Helper function to update employee module permissions
async function updateModulePermissions(supabaseClient, employeeId, permissions) {
  console.log("Updating module permissions for employee:", employeeId);

  // First, delete all existing module permissions for this employee
  const { error: deleteError } = await supabaseClient
    .from("employee_modules")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) {
    console.error("Error deleting employee modules:", deleteError);
    throw deleteError;
  }

  // Get the module IDs for each module key
  const { data: modules, error: moduleError } = await supabaseClient
    .from("modules")
    .select("id, key");

  if (moduleError) {
    console.error("Error fetching modules:", moduleError);
    throw moduleError;
  }

  // Map module keys to their IDs
  const moduleKeyToId = {};
  modules.forEach((module) => {
    moduleKeyToId[module.key] = module.id;
  });

  // Create array of module entries to insert
  const moduleEntries = Object.entries(permissions)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => ({
      employee_id: employeeId,
      module_id: moduleKeyToId[key],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    .filter((entry) => entry.module_id); // Ensure we only add entries for modules that exist

  if (moduleEntries.length === 0) {
    console.log("No module permissions to update");
    return;
  }

  // Insert the new module permissions
  const { error: insertError } = await supabaseClient
    .from("employee_modules")
    .insert(moduleEntries);

  if (insertError) {
    console.error("Error inserting employee modules:", insertError);
    throw insertError;
  }

  console.log(`Successfully updated ${moduleEntries.length} module permissions for employee ${employeeId}`);
}
