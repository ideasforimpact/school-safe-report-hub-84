
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, path",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    console.log("Received request:", req.method, req.url);
    
    // Log request headers for debugging
    const headers = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Request headers:", JSON.stringify(headers, null, 2));

    // Create a Supabase client with authentication from request
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Log auth header if present
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", authHeader ? "Yes" : "No");
    
    // Create Supabase client with auth if available
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { 
            ...(authHeader ? { Authorization: authHeader } : {})
          },
        },
      }
    );

    // Get the request path parameter
    const requestUrl = new URL(req.url);
    const path = requestUrl.pathname.split("/").pop();
    const pathHeader = req.headers.get("path");

    // Use path from header if available (helps with Supabase Function invoke)
    const effectivePath = pathHeader || path;

    console.log(`Request path: ${effectivePath}`);
    
    // IMPROVE: More robust request body parsing with detailed logging
    let bodyText = "";
    try {
      bodyText = await req.text();
      console.log("Raw request body:", bodyText);
      
      // Check for empty body early
      if (!bodyText || bodyText.trim() === '') {
        console.error("Empty request body");
        return new Response(JSON.stringify({ 
          error: "Request body is empty", 
          details: "The request body must contain valid JSON data"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } catch (textErr) {
      console.error("Error reading request body as text:", textErr);
      return new Response(JSON.stringify({ 
        error: "Error reading request body",
        details: textErr.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Parse JSON body
    let reqBody;
    try {
      reqBody = JSON.parse(bodyText);
      console.log("Request body parsed successfully:", reqBody);
    } catch (jsonErr) {
      console.error("Error parsing request body as JSON:", jsonErr);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON in request body",
        message: jsonErr.message,
        receivedBody: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Extract path from request body if it was passed there (useful for invoke method)
    const bodyPath = reqBody.path;
    if (bodyPath) {
      console.log("Using path from request body:", bodyPath);
    }
    
    // Final path determination
    const finalPath = bodyPath || effectivePath;
    console.log("Final determined path:", finalPath);
    
    // Handle the bulk-update path
    if (finalPath === "bulk-update") {
      console.log("Handling bulk update request");
      const { employees, clientId } = reqBody;
      
      console.log("ClientId from request:", clientId);
      
      if (!employees || !Array.isArray(employees)) {
        console.error("Invalid employees data:", reqBody);
        return new Response(JSON.stringify({ error: "Invalid request format. Expected 'employees' array." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log(`Processing bulk update for ${employees.length} employees`);

      // Check and standardize clientId format
      let processedClientId = null;
      if (clientId) {
        // Check if clientId is a valid UUID
        if (isValidUUID(clientId)) {
          processedClientId = clientId;
          console.log("Valid UUID clientId provided:", processedClientId);
        } else if (typeof clientId === 'string' && !isNaN(parseInt(clientId))) {
          // For numeric IDs in string format, we need to set it to null
          // The database will use a default value or reject it if required
          console.log("Numeric clientId cannot be used directly, setting to null");
          processedClientId = null;
        } else {
          console.log("Invalid clientId format, setting to null");
          processedClientId = null;
        }
      }

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
            status: emp.status || 'active',
            client_id: processedClientId,  // Use processed clientId
            // modulePermissions will be handled separately
          });
        } else {
          // Check if we have an employee with this employee_id already
          employeeIdMap.set(emp.employeeId.toLowerCase(), {
            ...emp,
            clientId: processedClientId // Use processed clientId
          });
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
          console.error("Error looking up existing employees:", lookupError);
        } else {
          console.log(`Found ${existingEmployees?.length || 0} existing employees`);
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
              status: empData.status || 'active',
              client_id: processedClientId,  // Use processed clientId
              // modulePermissions will be handled separately
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
            status: empData.status || 'active',
            client_id: processedClientId,  // Use processed clientId
            // modulePermissions will be stored for later use
            modulePermissions: empData.modulePermissions
          });
        }
      }
      
      console.log(`Processing ${toCreate.length} new employees and ${toUpdate.length} existing employees`);
      console.log("First new employee to create:", toCreate.length > 0 ? toCreate[0] : "None");
      
      const results = {
        created: [],
        updated: [],
        errors: []
      };
      
      // Create new employees in bulk if there are any
      if (toCreate.length > 0) {
        // Prepare the data for insert
        const insertData = toCreate.map(({ modulePermissions, ...emp }) => {
          // Log the client_id for debugging
          console.log(`Inserting employee with client_id:`, emp.client_id);
          return emp;
        });
        
        const { data: createdData, error: createError } = await supabaseClient
          .from("employees")
          .insert(insertData) // Remove modulePermissions from insert data
          .select();
          
        if (createError) {
          console.error("Error creating employees:", createError);
          results.errors.push(`Bulk create error: ${createError.message}`);
        } else {
          results.created = createdData || [];
          console.log(`Successfully created ${results.created.length} employees`);
          
          // Now handle module permissions for each created employee
          for (let i = 0; i < results.created.length; i++) {
            const employee = results.created[i];
            const empData = toCreate[i];
            
            // Set default module permissions (incidentReporting and transportSafetyAdmin)
            const modulePermissions = empData.modulePermissions || {
              superAdmin: false,
              incidentReporting: true, // Enable by default
              incidentAdmin: false,
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: true, // Enable by default
              eduSafeResourceAccess: false
            };
            
            try {
              await updateModulePermissions(supabaseClient, employee.id, modulePermissions);
            } catch (error) {
              console.error(`Error setting module permissions for employee ${employee.id}:`, error);
              results.errors.push(`Failed to set module permissions for ${employee.employee_id}: ${error.message}`);
            }
          }
        }
      }
      
      // Update existing employees
      for (const emp of toUpdate) {
        const { id, modulePermissions, ...updateData } = emp;
        
        console.log(`Updating employee ${id} with client_id:`, updateData.client_id);
        
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
          
          // Find original employee data to get modulePermissions
          const originalEmp = employees.find(e => e.id === id);
          
          // Set default module permissions if not provided
          const defaultModulePermissions = {
            superAdmin: false,
            incidentReporting: true, // Enable by default
            incidentAdmin: false,
            assessmentUser: false,
            assessmentsAdmin: false,
            employeeVerificationAdmin: false,
            grievancesAdmin: false,
            transportSafetyAdmin: true, // Enable by default
            eduSafeResourceAccess: false
          };
          
          // Use provided modulePermissions or defaults
          try {
            await updateModulePermissions(
              supabaseClient, 
              id, 
              originalEmp?.modulePermissions || defaultModulePermissions
            );
          } catch (error) {
            console.error(`Error updating module permissions for employee ${id}:`, error);
            results.errors.push(`Failed to update module permissions for ${emp.employee_id}: ${error.message}`);
          }
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
    } else {
      // Handle other operations from the request body
      const { operation, employee, id } = reqBody;
      
      console.log("Handling operation:", operation);

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
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

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

// Create a new employee
async function handleCreate(supabaseClient, employeeData) {
  console.log("Creating employee:", employeeData);

  // Process the clientId if it's not in UUID format
  let processedClientId = null;
  if (employeeData.clientId) {
    if (isValidUUID(employeeData.clientId)) {
      processedClientId = employeeData.clientId;
    } else {
      console.log("Non-UUID clientId provided, setting to null");
    }
  }

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
    client_id: processedClientId, // Use processed clientId
  };

  console.log("DB employee data for insert:", dbEmployee);

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
  // If not, set default permissions (incidentReporting and transportSafetyAdmin)
  const modulePermissions = employeeData.modulePermissions || {
    superAdmin: false,
    incidentReporting: true, // Enable by default
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: true, // Enable by default
    eduSafeResourceAccess: false
  };
  
  if (employee) {
    await updateModulePermissions(supabaseClient, employee.id, modulePermissions);
  }

  return new Response(JSON.stringify({ success: true, employee }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 201,
  });
}

// Update an existing employee
async function handleUpdate(supabaseClient, employeeData) {
  console.log("Updating employee:", employeeData);

  // Process the clientId if it's not in UUID format
  let processedClientId = null;
  if (employeeData.clientId) {
    if (isValidUUID(employeeData.clientId)) {
      processedClientId = employeeData.clientId;
    } else {
      console.log("Non-UUID clientId provided, setting to null");
    }
  }

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
  if (processedClientId) dbEmployee.client_id = processedClientId;
  
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
  // If not, set default permissions (incidentReporting and transportSafetyAdmin)
  const modulePermissions = employeeData.modulePermissions || {
    superAdmin: false,
    incidentReporting: true, // Enable by default
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: true, // Enable by default
    eduSafeResourceAccess: false
  };
  
  await updateModulePermissions(supabaseClient, employeeData.id, modulePermissions);

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

/**
 * Check if a string is a valid UUID
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
