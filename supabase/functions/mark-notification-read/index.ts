import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseAnonKey } from "../_shared/env.ts";
import { getActiveClient } from "../_shared/getActiveClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const recipientNotificationId = body?.recipient_notification_id as string | undefined;
    const notificationId = body?.notification_id as string | undefined;
    const markAll = Boolean(body?.mark_all);

    // Feature 3: scope to JWT app_metadata active employee (multi-client
    // users have N rows; picking the wrong row would mark the wrong
    // client's notifications as read).
    const { employee_id: activeEmployeeId } = await getActiveClient(supabase, user);
    if (!activeEmployeeId) {
      return new Response(
        JSON.stringify({ success: false, error: "Employee not found for current user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const employee = { id: activeEmployeeId };

    let updateQuery = supabase
      .from("centralized_notification_recipients")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_employee_id", employee.id)
      .eq("active", true)
      .eq("is_read", false);

    if (!markAll) {
      if (recipientNotificationId) {
        updateQuery = updateQuery.eq("id", recipientNotificationId);
      } else if (notificationId) {
        updateQuery = updateQuery.eq("notification_id", notificationId);
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "Provide recipient_notification_id or notification_id, or use mark_all=true" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error?.message || error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

