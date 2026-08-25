import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const body = await req.json();
    const { resource, operation, id, categoryId, excludeId, activeOnly, payload = {} } = body;

    const userId = getUserIdFromAuthorization(req.headers.get("Authorization"));

    // listAll has no single `resource` — it fetches every resource's list in one
    // round trip (replaces 5 separate `list` calls, one per Incident Configuration
    // sub-tab, with 5 parallel queries inside a single edge-function invocation).
    if (operation === "listAll") {
      const clientId = await resolveClientId(supabase, userId, body.clientId);
      if (!clientId) {
        throw new Error("Client ID is required");
      }

      const resources: Resource[] = ["categories", "subcategories", "priorities", "reportTypes", "contributingFactors"];
      const [categories, subcategories, priorities, reportTypes, contributingFactors] = await Promise.all(
        resources.map((r) => listItems(supabase, r, clientId, { activeOnly, clientTypeId: body.clientTypeId }))
      );

      return json({ data: { categories, subcategories, priorities, reportTypes, contributingFactors } });
    }

    if (!resourceConfig[resource as Resource]) {
      throw new Error("Invalid incident configuration resource");
    }

    const typedResource = resource as Resource;
    const clientId = await resolveClientId(supabase, userId, body.clientId, id, typedResource);
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    switch (operation) {
      case "list":
        return json({ data: await listItems(supabase, typedResource, clientId, { categoryId, activeOnly, clientTypeId: body.clientTypeId }) });
      case "checkDuplicate":
        return json({ data: await checkDuplicate(supabase, typedResource, clientId, payload.name, { categoryId, excludeId, clientTypeId: body.clientTypeId }) });
      case "create":
        return json({ data: await createItem(supabase, typedResource, clientId, payload, body.clientTypeId) });
      case "update":
        return json({ data: await updateItem(supabase, typedResource, clientId, id, payload, categoryId, body.clientTypeId) });
      case "delete":
        await deleteItem(supabase, typedResource, clientId, id);
        return json({ data: true });
      case "toggleStatus":
        return json({ data: await toggleStatus(supabase, typedResource, clientId, id, Boolean(payload.isActive)) });
      default:
        throw new Error("Invalid incident configuration operation");
    }
  } catch (error) {
    console.error("incident-configuration error:", error);
    return json({ error: "INCIDENT_CONFIGURATION_ERROR", message: error.message }, 400);
  }
});

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

  // Resolve from the calling user's own employee record first — this is the
  // only branch with real authorization meaning (which client this user
  // belongs to). The id-based lookup below just derives a row's own
  // client_id with no check that the caller belongs to it, so it must stay
  // a last resort, not take priority over the caller's actual identity.
  if (userId) {
    const { data: employee } = await supabase
      .from("employees")
      .select("client_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (employee?.client_id) return employee.client_id;
  }

  if (id && resource && resourceConfig[resource]) {
    const { data } = await supabase
      .from(resourceConfig[resource].table)
      .select("client_id")
      .eq("id", id)
      .maybeSingle();
    if (data?.client_id) return data.client_id;
  }

  return null;
}

async function listItems(supabase: any, resource: Resource, clientId: string, options: { categoryId?: string; activeOnly?: boolean; clientTypeId?: string }) {
  const config = resourceConfig[resource];
  let query = supabase.from(config.table).select(config.columns).eq("client_id", clientId);

  if (resource === "subcategories" && options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if ((resource === "priorities" || resource === "reportTypes") && options.activeOnly) {
    query = query.eq("is_active", true);
  }

  // categories/subcategories/priorities/reportTypes/contributingFactors are all
  // scoped by client_type_id (see buildRecord) — filter the list the same way
  // the direct-query services this replaces did, so items created for one
  // client type don't leak into another type's list for the same client.
  if (options.clientTypeId) {
    query = query.eq("client_type_id", options.clientTypeId);
  }

  const { data, error } = await query.order(config.order, { ascending: true });
  if (error) throw error;
  const rows = data ?? [];

  if (resource === "categories" || resource === "subcategories") {
    return attachIncidentUsage(supabase, resource, clientId, rows);
  }

  return rows;
}

// Batch-checks which of the given categories/subcategories are referenced by at
// least one incident, so the UI can hide the Delete action instead of only
// discovering the block after the user confirms deletion (see checkReferences).
async function attachIncidentUsage(supabase: any, resource: "categories" | "subcategories", clientId: string, rows: any[]) {
  if (rows.length === 0) return rows;

  const column = resource === "categories" ? "category_id" : "subcategory_id";
  const { data, error } = await supabase
    .from("incidents")
    .select(column)
    .eq("client_id", clientId)
    .not(column, "is", null);
  if (error) throw error;

  const usedIds = new Set((data ?? []).map((row: any) => row[column]));
  return rows.map((row: any) => ({ ...row, is_used_by_incident: usedIds.has(row.id) }));
}

async function checkDuplicate(
  supabase: any,
  resource: Resource,
  clientId: string,
  name: unknown,
  options: { categoryId?: string; excludeId?: string; clientTypeId?: string },
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

  // categories/subcategories/priorities/reportTypes/contributingFactors are all
  // scoped by client_type_id (see buildRecord/listItems) — the same name is
  // allowed to exist once per client type under the same client, so the
  // duplicate check must be scoped the same way or it false-positives across types.
  if (options.clientTypeId) {
    query = query.eq("client_type_id", options.clientTypeId);
  }

  if (options.excludeId) {
    query = query.neq("id", options.excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function createItem(supabase: any, resource: Resource, clientId: string, payload: Record<string, unknown>, clientTypeId?: string) {
  const name = String(payload.name ?? "").trim();
  if (!name) throw new Error("Name cannot be empty");
  if (resource === "subcategories" && !payload.categoryId) {
    throw new Error("Category ID is required");
  }

  const duplicate = await checkDuplicate(supabase, resource, clientId, name, {
    categoryId: payload.categoryId as string | undefined,
    clientTypeId,
  });
  if (duplicate) throw new Error(duplicateMessage(resource));

  const record = buildRecord(resource, payload, clientId, name, clientTypeId);
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
  clientTypeId?: string,
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
    clientTypeId,
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

function buildRecord(resource: Resource, payload: Record<string, unknown>, clientId: string, name: string, clientTypeId?: string) {
  const base: Record<string, unknown> = {
    name,
    description: payload.description || null,
    client_id: clientId,
  };

  // Only set on create (clientTypeId is only passed there) — categories/subcategories/
  // priorities/reportTypes are scoped by client_type_id so items created for one
  // client type don't leak into another type's list for the same client.
  if (clientTypeId) {
    base.client_type_id = clientTypeId;
  }

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
