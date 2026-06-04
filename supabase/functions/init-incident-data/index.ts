
// Follow the Deno deploy runtime compatibility
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Resource = "categories" | "subcategories" | "priorities" | "reportTypes" | "contributingFactors";

const resourceConfig: Record<Resource, { table: string; order: string; columns: string }> = {
  categories: {
    table: "incident_categories",
    order: "name",
    columns: "id, name, description, client_id, is_active",
  },
  subcategories: {
    table: "incident_subcategories",
    order: "name",
    columns: "id, name, description, category_id, client_id, is_active",
  },
  priorities: {
    table: "incident_priorities",
    order: "weight",
    columns: "id, name, description, color, weight, is_active, client_id",
  },
  reportTypes: {
    table: "incident_report_types",
    order: "name",
    columns: "id, name, description, is_active, client_id",
  },
  contributingFactors: {
    table: "contributing_factors",
    order: "name",
    columns: "id, name, description, weight, client_id",
  },
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body?.resource && body?.operation) {
      return await handleIncidentConfiguration(req, body);
    }

    // fetch-all: return all incident config data for a client in one response
    if (body?.action === "fetch-all" && body?.clientId) {
      return await handleFetchAll(body.clientId);
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exposed by default
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the function
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    console.log("Initializing incident reference data...");

    // First, initialize the status values if they don't exist
    const statusValues = ["New", "Open", "In Progress", "Closed", "On Hold"];
    const newStatusId = await ensureStatuses(supabaseClient, statusValues);
    
    // Initialize report types
    await ensureReportTypes(supabaseClient);
    
    // Initialize categories
    await ensureCategories(supabaseClient);
    
    // Initialize priorities
    await ensurePriorities(supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Incident reference data initialized successfully",
        newStatusId: newStatusId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleFetchAll(clientId: string) {
  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

  const [categories, subcategories, contributingFactors, reportTypes, priorities] = await Promise.all([
    supabase.from("incident_categories").select(resourceConfig.categories.columns).eq("client_id", clientId).order(resourceConfig.categories.order),
    supabase.from("incident_subcategories").select(resourceConfig.subcategories.columns).eq("client_id", clientId).order(resourceConfig.subcategories.order),
    supabase.from("contributing_factors").select(resourceConfig.contributingFactors.columns).eq("client_id", clientId).order(resourceConfig.contributingFactors.order),
    supabase.from("incident_report_types").select(resourceConfig.reportTypes.columns).order(resourceConfig.reportTypes.order),
    supabase.from("incident_priorities").select(resourceConfig.priorities.columns).order(resourceConfig.priorities.order),
  ]);

  return new Response(
    JSON.stringify({
      categories: categories.data ?? [],
      subcategories: subcategories.data ?? [],
      contributingFactors: contributingFactors.data ?? [],
      reportTypes: reportTypes.data ?? [],
      priorities: priorities.data ?? [],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
}

async function handleIncidentConfiguration(req: Request, body: any) {
  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
  const { resource, operation, id, categoryId, excludeId, activeOnly, payload = {} } = body;

  if (!resourceConfig[resource as Resource]) {
    throw new Error("Invalid incident configuration resource");
  }

  const typedResource = resource as Resource;
  const userId = getUserIdFromAuthorization(req.headers.get("Authorization"));
  const clientId = await resolveClientId(supabase, userId, body.clientId, id, typedResource);
  if (!clientId) {
    throw new Error("Client ID is required");
  }

  switch (operation) {
    case "list":
      return json({ data: await listItems(supabase, typedResource, clientId, { categoryId, activeOnly }) });
    case "checkDuplicate":
      return json({ data: await checkDuplicate(supabase, typedResource, clientId, payload.name, { categoryId, excludeId }) });
    case "create":
      return json({ data: await createItem(supabase, typedResource, clientId, payload) });
    case "update":
      return json({ data: await updateItem(supabase, typedResource, clientId, id, payload, categoryId) });
    case "delete":
      await deleteItem(supabase, typedResource, clientId, id);
      return json({ data: true });
    case "toggleStatus":
      return json({ data: await toggleStatus(supabase, typedResource, clientId, id, Boolean(payload.isActive)) });
    default:
      throw new Error("Invalid incident configuration operation");
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserIdFromAuthorization(authHeader: string | null) {
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "");
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4), "=");
    const decodedPayload = JSON.parse(atob(paddedPayload));
    return decodedPayload.sub ?? null;
  } catch {
    return null;
  }
}

async function resolveClientId(supabase: any, userId: string | null, requestedClientId?: string, id?: string, resource?: Resource) {
  if (requestedClientId) return requestedClientId;

  if (id && resource && resourceConfig[resource]) {
    const { data } = await supabase
      .from(resourceConfig[resource].table)
      .select("client_id")
      .eq("id", id)
      .maybeSingle();
    if (data?.client_id) return data.client_id;
  }

  if (!userId) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("client_id")
    .eq("user_id", userId)
    .maybeSingle();

  return employee?.client_id ?? null;
}

async function listItems(supabase: any, resource: Resource, clientId: string, options: { categoryId?: string; activeOnly?: boolean }) {
  const config = resourceConfig[resource];
  let query = supabase.from(config.table).select(config.columns).eq("client_id", clientId);

  if (resource === "subcategories" && options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if ((resource === "priorities" || resource === "reportTypes") && options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order(config.order, { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function checkDuplicate(
  supabase: any,
  resource: Resource,
  clientId: string,
  name: unknown,
  options: { categoryId?: string; excludeId?: string },
) {
  const trimmedName = String(name ?? "").trim();
  if (!trimmedName) return false;

  let query = supabase
    .from(resourceConfig[resource].table)
    .select("id")
    .eq("client_id", clientId)
    .ilike("name", trimmedName);

  if (resource === "subcategories" && options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options.excludeId) {
    query = query.neq("id", options.excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function createItem(supabase: any, resource: Resource, clientId: string, payload: Record<string, unknown>) {
  const name = String(payload.name ?? "").trim();
  if (!name) throw new Error("Name cannot be empty");
  if (resource === "subcategories" && !payload.categoryId) {
    throw new Error("Category ID is required");
  }

  const duplicate = await checkDuplicate(supabase, resource, clientId, name, {
    categoryId: payload.categoryId as string | undefined,
  });
  if (duplicate) throw new Error(duplicateMessage(resource));

  const record = buildRecord(resource, payload, clientId, name);
  const { data, error } = await supabase
    .from(resourceConfig[resource].table)
    .insert(record)
    .select(resourceConfig[resource].columns)
    .single();

  if (error) throw error;
  return data;
}

async function updateItem(
  supabase: any,
  resource: Resource,
  clientId: string,
  id: string,
  payload: Record<string, unknown>,
  categoryId?: string,
) {
  if (!id) throw new Error("Record ID is required");
  const name = String(payload.name ?? "").trim();
  if (!name) throw new Error("Name cannot be empty");

  const resolvedCategoryId =
    resource === "subcategories"
      ? String(payload.categoryId ?? categoryId ?? (await getSubcategoryCategoryId(supabase, id, clientId)) ?? "")
      : undefined;
  if (resource === "subcategories" && !resolvedCategoryId) {
    throw new Error("Category ID is required");
  }

  const duplicate = await checkDuplicate(supabase, resource, clientId, name, {
    categoryId: resolvedCategoryId,
    excludeId: id,
  });
  if (duplicate) throw new Error(duplicateMessage(resource));

  const recordPayload = resource === "subcategories"
    ? { ...payload, categoryId: resolvedCategoryId }
    : payload;
  const record = buildRecord(resource, recordPayload, clientId, name);
  delete record.client_id;

  const { data, error } = await supabase
    .from(resourceConfig[resource].table)
    .update(record)
    .eq("id", id)
    .eq("client_id", clientId)
    .select(resourceConfig[resource].columns)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Record not found or access denied");
  return data;
}

async function deleteItem(supabase: any, resource: Resource, clientId: string, id: string) {
  if (!id) throw new Error("Record ID is required");
  const referenceCheck = await checkReferences(supabase, resource, clientId, id);
  if (referenceCheck.hasReferences) throw new Error(referenceCheck.message);

  if (resource === "categories") {
    const { error: subcategoryError } = await supabase
      .from("incident_subcategories")
      .delete()
      .eq("category_id", id)
      .eq("client_id", clientId);
    if (subcategoryError) throw subcategoryError;
  }

  const { error } = await supabase
    .from(resourceConfig[resource].table)
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);
  if (error) throw error;
}

async function toggleStatus(supabase: any, resource: Resource, clientId: string, id: string, isActive: boolean) {
  if (resource !== "priorities" && resource !== "reportTypes") {
    throw new Error("Status toggling is not supported for this resource");
  }

  if (!isActive) {
    const referenceCheck = await checkReferences(supabase, resource, clientId, id);
    if (referenceCheck.hasReferences) {
      throw new Error(referenceCheck.message.replace("Cannot delete", "Cannot deactivate"));
    }
  }

  const { data, error } = await supabase
    .from(resourceConfig[resource].table)
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("client_id", clientId)
    .select(resourceConfig[resource].columns)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Record not found or access denied");
  return data;
}

function buildRecord(resource: Resource, payload: Record<string, unknown>, clientId: string, name: string) {
  const base: Record<string, unknown> = {
    name,
    description: payload.description || null,
    client_id: clientId,
  };

  if (resource === "categories" || resource === "subcategories") {
    base.is_active = true;
  }

  if (resource === "subcategories") {
    base.category_id = payload.categoryId;
  }

  if (resource === "priorities") {
    base.color = payload.color || null;
    base.weight = payload.weight ?? 0;
  }

  if (resource === "contributingFactors") {
    base.weight = payload.weight || null;
  }

  return base;
}

async function getSubcategoryCategoryId(supabase: any, id: string, clientId: string) {
  const { data, error } = await supabase
    .from("incident_subcategories")
    .select("category_id")
    .eq("id", id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data?.category_id;
}

async function checkReferences(supabase: any, resource: Resource, clientId: string, id: string) {
  const columnByResource: Partial<Record<Resource, string>> = {
    categories: "category_id",
    subcategories: "subcategory_id",
    priorities: "priority_id",
    reportTypes: "type_id",
  };

  if (resource === "contributingFactors") {
    const { data, error } = await supabase
      .from("incidents")
      .select("id, contributing_factor")
      .eq("client_id", clientId)
      .not("contributing_factor", "is", null);
    if (error) throw error;

    const count = (data ?? []).filter((incident: any) => {
      const factors = Array.isArray(incident.contributing_factor) ? incident.contributing_factor : [];
      return factors.some((factor: any) => String(factor?.id ?? "").trim() === String(id).trim());
    }).length;

    return referenceResult("contributing factor", count);
  }

  const column = columnByResource[resource];
  if (!column) return referenceResult("record", 0);

  const { count, error } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq(column, id)
    .eq("client_id", clientId);

  if (error) throw error;
  return referenceResult(referenceName(resource), count ?? 0);
}

function referenceResult(name: string, count: number) {
  return {
    hasReferences: count > 0,
    count,
    message: count > 0
      ? `Cannot delete this ${name} because it is currently linked to ${count} incident${count > 1 ? "s" : ""}`
      : "",
  };
}

function referenceName(resource: Resource) {
  if (resource === "categories") return "category";
  if (resource === "subcategories") return "subcategory";
  if (resource === "priorities") return "priority";
  if (resource === "reportTypes") return "report type";
  return "record";
}

function duplicateMessage(resource: Resource) {
  if (resource === "subcategories") return "A subcategory with this name already exists in this category";
  if (resource === "priorities") return "A priority with this name already exists";
  if (resource === "reportTypes") return "A report type with this name already exists";
  if (resource === "contributingFactors") return "A contributing factor with this name already exists";
  return "A category with this name already exists";
}

async function ensureStatuses(supabaseClient, statusValues) {
  console.log("Ensuring incident statuses exist...");
  
  // Check if we have the "New" status
  const { data: newStatus, error: newStatusError } = await supabaseClient
    .from("incident_status")
    .select("*")
    .eq("name", "New")
    .maybeSingle();
    
  let newStatusId = null;
    
  if (newStatusError) {
    console.error("Error checking for New status:", newStatusError);
  } else if (newStatus) {
    console.log("New status exists:", newStatus);
    newStatusId = newStatus.id;
  } else {
    // Create the New status with a specific UUID
    const newId = crypto.randomUUID();
    const { data, error } = await supabaseClient
      .from("incident_status")
      .insert({ 
        id: newId,
        name: "New", 
        description: "Incident has been reported but not yet reviewed" 
      })
      .select();
      
    if (error) {
      console.error("Error creating New status:", error);
    } else {
      console.log("Created New status:", data[0]);
      newStatusId = newId;
    }
  }
  
  // Add the rest of the statuses
  for (const status of statusValues) {
    if (status === "New") continue; // Skip New as we handled it above
    
    const { data, error } = await supabaseClient
      .from("incident_status")
      .select("*")
      .eq("name", status)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${status} status:`, error);
    } else if (!data) {
      // Status doesn't exist, create it
      const { error: insertError } = await supabaseClient
        .from("incident_status")
        .insert({ 
          name: status, 
          description: `Incident is in ${status} status` 
        });
        
      if (insertError) {
        console.error(`Error creating ${status} status:`, insertError);
      } else {
        console.log(`Created ${status} status`);
      }
    }
  }
  
  return newStatusId;
}

async function ensureReportTypes(supabaseClient) {
  console.log("Ensuring report types exist...");
  
  const reportTypes = [
    { name: "Incident", description: "A safety-related event that occurred" },
    { name: "Near Miss", description: "A potential incident that was avoided" },
    { name: "Unsafe Condition", description: "A condition that could lead to an incident" }
  ];
  
  for (const type of reportTypes) {
    const { data, error } = await supabaseClient
      .from("incident_report_types")
      .select("*")
      .eq("name", type.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${type.name} type:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_report_types")
        .insert(type);
        
      if (insertError) {
        console.error(`Error creating ${type.name} type:`, insertError);
      } else {
        console.log(`Created ${type.name} type`);
      }
    }
  }
}

async function ensureCategories(supabaseClient) {
  console.log("Ensuring incident categories exist...");
  
  const categories = [
    { name: "Physical Injury", description: "Incidents resulting in physical harm" },
    { name: "Bullying", description: "Incidents involving bullying or harassment" },
    { name: "Tech Misuse", description: "Misuse of technology resources" },
    { name: "Property Damage", description: "Damage to school property or equipment" },
    { name: "Health Concern", description: "Non-injury health related concerns" },
    { name: "Security Breach", description: "Security violations or breaches" },
    { name: "Other", description: "Other incidents not fitting above categories" }
  ];
  
  for (const category of categories) {
    const { data, error } = await supabaseClient
      .from("incident_categories")
      .select("*")
      .eq("name", category.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${category.name} category:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_categories")
        .insert(category);
        
      if (insertError) {
        console.error(`Error creating ${category.name} category:`, insertError);
      } else {
        console.log(`Created ${category.name} category`);
      }
    }
  }
}

async function ensurePriorities(supabaseClient) {
  console.log("Ensuring incident priorities exist...");
  
  const priorities = [
    { name: "Low", description: "Minor issue, address when convenient", weight: 1, color: "#22C55E" },
    { name: "Medium", description: "Important issue requiring attention", weight: 2, color: "#EAB308" },
    { name: "High", description: "Urgent issue requiring immediate attention", weight: 3, color: "#EF4444" },
    { name: "Critical", description: "Emergency situation requiring immediate response", weight: 4, color: "#7F1D1D" }
  ];
  
  for (const priority of priorities) {
    const { data, error } = await supabaseClient
      .from("incident_priorities")
      .select("*")
      .eq("name", priority.name)
      .maybeSingle();
      
    if (error) {
      console.error(`Error checking for ${priority.name} priority:`, error);
    } else if (!data) {
      const { error: insertError } = await supabaseClient
        .from("incident_priorities")
        .insert(priority);
        
      if (insertError) {
        console.error(`Error creating ${priority.name} priority:`, insertError);
      } else {
        console.log(`Created ${priority.name} priority`);
      }
    }
  }
}
