import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "../_shared/env.ts";

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();
const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await authedClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function resolveHeadOfficeClientId(employeeClientId: string): Promise<string | null> {
  const { data: employeeClient, error: employeeClientError } = await serviceSupabase
    .from("clients")
    .select("id, is_head_office")
    .eq("id", employeeClientId)
    .single();

  if (employeeClientError || !employeeClient) {
    return null;
  }

  if (employeeClient.is_head_office) {
    return employeeClient.id;
  }

  const { data: mapping, error: mappingError } = await serviceSupabase
    .from("client_mappings")
    .select("head_office_id")
    .eq("sub_client_id", employeeClientId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (mappingError) {
    return null;
  }

  return mapping?.head_office_id ?? null;
}

async function getSwitchableClients(headOfficeClientId: string) {
  const { data: headOfficeClient, error: headOfficeError } = await serviceSupabase
    .from("clients")
    .select("id, name, is_head_office, active")
    .eq("id", headOfficeClientId)
    .single();

  if (headOfficeError || !headOfficeClient) {
    throw new Error("Head office client not found");
  }

  const { data: mappings, error: mappingsError } = await serviceSupabase
    .from("client_mappings")
    .select("sub_client_id")
    .eq("head_office_id", headOfficeClientId)
    .eq("active", true);

  if (mappingsError) {
    throw new Error(`Failed to load mapped clients: ${mappingsError.message}`);
  }

  const subClientIds = (mappings || []).map((row) => row.sub_client_id);
  let subClients: Array<{ id: string; name: string; active: boolean; is_head_office: boolean }> = [];
  if (subClientIds.length > 0) {
    const { data: rows, error: subClientsError } = await serviceSupabase
      .from("clients")
      .select("id, name, active, is_head_office")
      .in("id", subClientIds)
      .order("name");

    if (subClientsError) {
      throw new Error(`Failed to load sub-clients: ${subClientsError.message}`);
    }
    subClients = rows || [];
  }

  return {
    headOffice: headOfficeClient,
    subClients,
    mappings: mappings || [],
  };
}

function getClientManagementPermissions(
  roleCode: "W/R" | "R",
) {
  return {
    access_level: roleCode,
  };
}

async function getRoleLookup() {
  const { data: roles, error } = await serviceSupabase
    .from("client_roles")
    .select("id, access_level")
    .in("access_level", ["W/R", "R"])
    .eq("active", true);

  if (error || !roles || roles.length < 2) {
    throw new Error(`Failed to load client roles: ${error?.message || "missing roles"}`);
  }

  const fullAccessRoleId = roles.find((role) => role.access_level === "W/R")?.id;
  const readOnlyRoleId = roles.find((role) => role.access_level === "R")?.id;

  if (!fullAccessRoleId || !readOnlyRoleId) {
    throw new Error("Required client roles are not configured");
  }

  return { fullAccessRoleId, readOnlyRoleId };
}

async function resolveRoleAccessLevelById(roleId: string | null | undefined): Promise<"W/R" | "R"> {
  if (!roleId) return "R";
  const { data: role, error: roleError } = await serviceSupabase
    .from("client_roles")
    .select("access_level")
    .eq("id", roleId)
    .eq("active", true)
    .maybeSingle();

  if (roleError || !role) {
    return "R";
  }

  return role.access_level === "R" ? "R" : "W/R";
}

async function resolveClientRoleCode(clientId: string): Promise<"W/R" | "R"> {
  const { data: client, error: clientError } = await serviceSupabase
    .from("clients")
    .select("client_role_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    throw new Error(`Failed to resolve client role: ${clientError?.message || "client not found"}`);
  }

  return await resolveRoleAccessLevelById(client.client_role_id);
}

async function getOrCreateUserClientContext(
  userId: string,
  homeClientId: string,
  readOnlyRoleId: string,
) {
  const { data: existingContext, error: contextError } = await serviceSupabase
    .from("user_client_context")
    .select("user_id, home_client_id, target_client_id, role_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (contextError) {
    throw new Error(`Failed to read user client context: ${contextError.message}`);
  }

  if (!existingContext) {
    const { data: insertedContext, error: insertError } = await serviceSupabase
      .from("user_client_context")
      .insert({
        user_id: userId,
        home_client_id: homeClientId,
        target_client_id: homeClientId,
        role_id: readOnlyRoleId,
      })
      .select("user_id, home_client_id, target_client_id, role_id")
      .single();

    if (insertError || !insertedContext) {
      throw new Error(`Failed to initialize user client context: ${insertError?.message || "unknown error"}`);
    }

    return insertedContext;
  }

  if (existingContext.home_client_id !== homeClientId) {
    const { data: updatedContext, error: updateError } = await serviceSupabase
      .from("user_client_context")
      .update({
        home_client_id: homeClientId,
        target_client_id: homeClientId,
        role_id: readOnlyRoleId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("user_id, home_client_id, target_client_id, role_id")
      .single();

    if (updateError || !updatedContext) {
      throw new Error(`Failed to realign user client context: ${updateError?.message || "unknown error"}`);
    }
    return updatedContext;
  }

  return existingContext;
}

async function updateTargetClientContext(
  userId: string,
  targetClientId: string,
  readOnlyRoleId: string,
) {
  const { data: updatedContext, error: updateError } = await serviceSupabase
    .from("user_client_context")
    .update({
      target_client_id: targetClientId,
      role_id: readOnlyRoleId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id, home_client_id, target_client_id, role_id")
    .single();

  if (updateError || !updatedContext) {
    throw new Error(`Failed to update target client context: ${updateError?.message || "unknown error"}`);
  }
  return updatedContext;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    const { data: employee, error: employeeError } = await serviceSupabase
      .from("employees")
      .select("id, client_id, status, is_super_admin")
      .eq("user_id", user.id)
      .eq("status", true)
      .limit(1)
      .maybeSingle();

    if (employeeError || !employee?.client_id) {
      return jsonResponse({ success: false, error: "Employee context not found" }, 403);
    }

    if (employee.is_super_admin !== true) {
      return jsonResponse({ success: false, error: "Client switching is available only for super admin users" }, 403);
    }

    const headOfficeClientId = await resolveHeadOfficeClientId(employee.client_id);
    if (!headOfficeClientId) {
      return jsonResponse({ success: false, error: "Client switching is not available" }, 403);
    }

    const switchableClients = await getSwitchableClients(headOfficeClientId);
    const { fullAccessRoleId, readOnlyRoleId } = await getRoleLookup();
    const allowedClientIds = new Set([
      switchableClients.headOffice.id,
      ...switchableClients.subClients.map((client) => client.id),
    ]);
    let userContext = await getOrCreateUserClientContext(user.id, employee.client_id, readOnlyRoleId);

    if (!allowedClientIds.has(userContext.target_client_id)) {
      userContext = await updateTargetClientContext(user.id, userContext.home_client_id, readOnlyRoleId);
    }

    const isSwitchedContext = userContext.target_client_id !== userContext.home_client_id;
    const contextRoleCode = await resolveRoleAccessLevelById(userContext.role_id);
    const effectiveRoleCode = isSwitchedContext
      ? contextRoleCode
      : await resolveClientRoleCode(userContext.home_client_id);
    const clientManagementPermissions = getClientManagementPermissions(
      effectiveRoleCode,
    );
    const clientManagementReadOnly =
      isSwitchedContext &&
      clientManagementPermissions.access_level === "R";

    if (action === "list-switchable-clients") {
      return jsonResponse({
        success: true,
        head_office_id: headOfficeClientId,
        home_client_id: userContext.home_client_id,
        target_client_id: userContext.target_client_id,
        is_switched_context: isSwitchedContext,
        client_management_read_only: clientManagementReadOnly,
        client_management_permissions: clientManagementPermissions,
        clients: [switchableClients.headOffice, ...switchableClients.subClients],
      });
    }

    if (action === "switch-client") {
      const targetClientId = String(body?.target_client_id || "").trim();
      if (!targetClientId) {
        return jsonResponse({ success: false, error: "target_client_id is required" }, 400);
      }
      if (!allowedClientIds.has(targetClientId)) {
        return jsonResponse({ success: false, error: "Target client is not allowed" }, 403);
      }

      const { data: targetClient, error: targetClientError } = await serviceSupabase
        .from("clients")
        .select("id, name, active, is_head_office, client_type_id, institution_type, logo, client_logo")
        .eq("id", targetClientId)
        .single();

      if (targetClientError || !targetClient) {
        return jsonResponse({ success: false, error: "Target client not found" }, 404);
      }

      const updatedContext = await updateTargetClientContext(user.id, targetClientId, readOnlyRoleId);
      const switched = updatedContext.target_client_id !== updatedContext.home_client_id;
      const contextRole = await resolveRoleAccessLevelById(updatedContext.role_id);
      const resolvedRoleCode = switched
        ? contextRole
        : await resolveClientRoleCode(updatedContext.home_client_id);
      const permissions = getClientManagementPermissions(
        resolvedRoleCode,
      );
      const normalizedReadOnly = switched && permissions.access_level === "R";

      return jsonResponse({
        success: true,
        head_office_id: headOfficeClientId,
        home_client_id: updatedContext.home_client_id,
        target_client_id: updatedContext.target_client_id,
        is_switched_context: switched,
        client_management_read_only: normalizedReadOnly,
        client_management_permissions: permissions,
        selected_client: targetClient,
      });
    }

    return jsonResponse({ success: false, error: "Unknown action" }, 400);
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      500,
    );
  }
});
