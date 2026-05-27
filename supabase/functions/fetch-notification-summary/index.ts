import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseAnonKey } from "../_shared/env.ts";

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
    const moduleName = typeof body?.module_name === "string" ? body.module_name.trim() : null;
    const limit = Number.isFinite(body?.limit) ? Math.min(Math.max(Number(body.limit), 1), 25) : 10;
    const cursor = typeof body?.cursor === "string" && body.cursor.trim() ? body.cursor.trim() : null;

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (employeeError || !employee?.id) {
      return new Response(
        JSON.stringify({ success: true, unread_count: 0, notifications: [], next_cursor: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let unreadCount = 0;
    if (!cursor) {
      let unreadQuery = supabase
        .from("centralized_notification_recipients")
        .select("id, notification:centralized_notifications!inner(id, module_id, module_name, active)", { count: "exact", head: true })
        .eq("recipient_employee_id", employee.id)
        .eq("active", true)
        .eq("is_read", false)
        .eq("notification.active", true);

      if (moduleName) {
        unreadQuery = unreadQuery.eq("notification.module_name", moduleName);
      }

      const { count, error: unreadError } = await unreadQuery;
      if (unreadError) {
        throw unreadError;
      }
      unreadCount = count || 0;
    }

    let notificationsQuery = supabase
      .from("centralized_notification_recipients")
      .select(`
        id,
        is_read,
        read_at,
        created_at,
        notification:centralized_notifications!inner(
          id,
          module_id,
          module_name,
          notification_type,
          channel,
          title,
          message,
          payload,
          created_at
        )
      `)
      .eq("recipient_employee_id", employee.id)
      .eq("active", true)
      .eq("notification.active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (moduleName) {
      notificationsQuery = notificationsQuery.eq("notification.module_name", moduleName);
    }

    if (cursor) {
      notificationsQuery = notificationsQuery.lt("created_at", cursor);
    }

    const { data: notifications, error: notificationsError } = await notificationsQuery;
    if (notificationsError) {
      throw notificationsError;
    }

    const rows = notifications || [];
    const nextCursor = rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null;

    return new Response(
      JSON.stringify({
        success: true,
        unread_count: unreadCount,
        notifications: rows,
        next_cursor: nextCursor,
      }),
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

