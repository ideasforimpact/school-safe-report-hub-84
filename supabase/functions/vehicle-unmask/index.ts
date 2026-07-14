// @ts-nocheck
/**
 * vehicle-unmask
 *
 * On-demand "unmask" for a vehicle's chassis / engine number / owner name. The primary
 * masked RC endpoint (see vehicle-verify) returns these values partially hidden. This
 * function calls SurePass rc-full (which returns the real values) and persists them to the
 * dedicated vehicles.vehicle_chasi_number / vehicle_engine_number / vehicle_owner_name columns.
 *
 * Request body: { registrationNumber: string, vehicleId?: string }
 * Response: { success: boolean, vehicle_chasi_number?, vehicle_engine_number?, vehicle_owner_name?, message? }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const SUREPASS_BASE_URL = "https://kyc-api.surepass.io";
const SUREPASS_RC_FULL_ENDPOINT = "/api/v1/rc/rc-full";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { registrationNumber, vehicleId } = await req.json();

    if (!registrationNumber) {
      return new Response(
        JSON.stringify({ success: false, message: "registrationNumber is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey =
      Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || Deno.env.get("SUREPASS_API_KEY") || "";

    const url = `${SUREPASS_BASE_URL}${SUREPASS_RC_FULL_ENDPOINT}`;
    console.log(`[vehicle-unmask] Requesting rc-full for ${registrationNumber}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ id_number: registrationNumber }),
    });

    const payload = await resp.json();

    if (!resp.ok || payload?.success === false) {
      const message = payload?.message || `SurePass rc-full failed (${resp.status})`;
      console.error("[vehicle-unmask] SurePass error:", message);
      return new Response(
        JSON.stringify({ success: false, message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rc = payload?.data ?? {};
    const chasiNumber = rc.vehicle_chasi_number ?? null;
    const engineNumber = rc.vehicle_engine_number ?? null;
    const ownerName = rc.owner_name ?? null;

    if (!chasiNumber && !engineNumber && !ownerName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "rc-full response did not contain chassis, engine or owner name",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only write fields that came back present, so a partial response never nulls a column.
    const updates: Record<string, string> = {};
    if (chasiNumber) updates.vehicle_chasi_number = chasiNumber;
    if (engineNumber) updates.vehicle_engine_number = engineNumber;
    if (ownerName) updates.vehicle_owner_name = ownerName;

    let updateQuery = supabase.from("vehicles").update(updates);
    updateQuery = vehicleId
      ? updateQuery.eq("id", vehicleId)
      : updateQuery.eq("registration_number", registrationNumber);

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error("[vehicle-unmask] Failed to update vehicles:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to store unmasked values" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        vehicle_chasi_number: chasiNumber,
        vehicle_engine_number: engineNumber,
        vehicle_owner_name: ownerName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[vehicle-unmask] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
