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
    .eq("head_office_id", headOfficeClientId);

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
  };
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
      .select("id, client_id, status")
      .eq("user_id", user.id)
      .eq("status", true)
      .limit(1)
      .maybeSingle();

    if (employeeError || !employee?.client_id) {
      return jsonResponse({ success: false, error: "Employee context not found" }, 403);
    }

    const headOfficeClientId = await resolveHeadOfficeClientId(employee.client_id);
    if (!headOfficeClientId) {
      return jsonResponse({ success: false, error: "Client switching is not available" }, 403);
    }

    const switchableClients = await getSwitchableClients(headOfficeClientId);
    const allowedClientIds = new Set([
      switchableClients.headOffice.id,
      ...switchableClients.subClients.map((client) => client.id),
    ]);

    if (action === "list-switchable-clients") {
      return jsonResponse({
        success: true,
        head_office_id: headOfficeClientId,
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

      return jsonResponse({
        success: true,
        head_office_id: headOfficeClientId,
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
