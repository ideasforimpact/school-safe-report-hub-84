
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';
import { renderIncidentTemplate, IncidentNotificationType } from '../_shared/incidentNotificationTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    const body = await req.json();
    const {
      operation,
      clientId,
      employeeId,
      isSuperAdmin,
      clientTypeId,
      page = 1,
      pageSize = 10,
      search = '',
      category = '',
      subcategory = '',
      status = '',
      priority = '',
      location = '',
      facility = '',
      dateFrom = '',
      dateTo = '',
      hasIncidentAdmin,
      incidentId,
      checks,
      notificationType,
      recipientId,
      recipientEmail,
      recipientName,
      notificationPriority,
      notificationVariables,
      notificationMetadata,
      actionById,
    } = body;

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(supabaseClient, req, clientId, url.pathname);
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_config ──────────────────────────────────────────────────────────
    if (operation === 'get_config') {
      let reportTypesQuery = supabaseClient
        .from('incident_report_types')
        .select('id, name, description')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (clientTypeId) reportTypesQuery = reportTypesQuery.eq('client_type_id', clientTypeId);

      let categoriesQuery = supabaseClient
        .from('incident_categories')
        .select('id, name, description')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (clientTypeId) categoriesQuery = categoriesQuery.eq('client_type_id', clientTypeId);

      let subcategoriesQuery = supabaseClient
        .from('incident_subcategories')
        .select('id, name, category_id')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (clientTypeId) subcategoriesQuery = subcategoriesQuery.eq('client_type_id', clientTypeId);

      let prioritiesQuery = supabaseClient
        .from('incident_priorities')
        .select('id, name, color, weight')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('weight', { ascending: true });
      if (clientTypeId) prioritiesQuery = prioritiesQuery.eq('client_type_id', clientTypeId);

      const [
        reportTypesRes,
        categoriesRes,
        subcategoriesRes,
        locationsRes,
        facilitiesRes,
        prioritiesRes,
        statusRes,
        employeesRes,
        studentsRes,
      ] = await Promise.all([
        reportTypesQuery,
        categoriesQuery,
        subcategoriesQuery,
        (() => {
          let q = supabaseClient.from('campuses').select('id, name').eq('client_id', clientId);
          if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
          return q;
        })(),
        (() => {
          let q = supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId);
          if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
          return q;
        })(),
        prioritiesQuery,
        supabaseClient.from('incident_status').select('id, name'),
        supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).eq('is_secondary_super_admin', false).not('email', 'is', null).neq('email', ''),
        supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false }),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            reportTypes: reportTypesRes.data || [],
            categories: categoriesRes.data || [],
            subcategories: subcategoriesRes.data || [],
            locations: locationsRes.data || [],
            facilities: facilitiesRes.data || [],
            priorities: prioritiesRes.data || [],
            statuses: statusRes.data || [],
            employees: employeesRes.data || [],
            students: studentsRes.data || [],
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_stats ────────────────────────────────────────────────────────────
    if (operation === 'get_stats') {
      let query = supabaseClient
        .from('incidents')
        .select('id, created_by, assigned_to, incident_status!status_id(name)')
        .eq('client_id', clientId);

      if (!isSuperAdmin && !hasIncidentAdmin) {
        query = query.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = { total: 0, open: 0, inProgress: 0, closed: 0 };
      for (const inc of data ?? []) {
        stats.total++;
        const incidentStatus = (inc as { incident_status?: { name?: string } | { name?: string }[] }).incident_status;
        const status = Array.isArray(incidentStatus) ? incidentStatus[0]?.name : incidentStatus?.name;
        if (status === 'Open') stats.open++;
        else if (status === 'In Progress') stats.inProgress++;
        else if (status === 'Closed') stats.closed++;
      }

      return new Response(JSON.stringify({ success: true, data: stats }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── queue_notification ───────────────────────────────────────────────────
    // Server-side equivalent of src/services/notification/notificationService.ts's
    // queueNotification, scoped to the 4 incident notification types reachable from
    // create/edit/close/reopen (incident_reminder_10_days still goes through the
    // existing client-side path — it's cron-triggered, not part of these flows).
    // The client still builds the same NotificationData shape it always has; this
    // just moves the notification_rules/employees/email_queue/notification_logs
    // writes server-side instead of doing them as direct REST calls.
    if (operation === 'queue_notification') {
      const type = notificationType as IncidentNotificationType;
      const variables = (notificationVariables ?? {}) as Record<string, string>;
      const metadata = (notificationMetadata ?? {}) as Record<string, unknown>;

      if (!recipientId || !type) {
        throw new Error('recipientId and notificationType are required');
      }

      const stampSkip = async (reason: string) => {
        const sourceId = metadata.incidentId as string | undefined;
        if (!sourceId) return;

        const { data: current } = await supabaseClient
          .from('incidents')
          .select('skipped_notifications')
          .eq('id', sourceId)
          .maybeSingle();
        if (!current) return;

        const existing = Array.isArray((current as Record<string, unknown>).skipped_notifications)
          ? (current as Record<string, unknown>).skipped_notifications as unknown[]
          : [];

        await supabaseClient
          .from('incidents')
          .update({
            is_skipped: true,
            skipped_notifications: [...existing, {
              type,
              reason,
              recipient_id: recipientId,
              recipient_email: recipientEmail ?? null,
              skipped_at: new Date().toISOString(),
            }],
          })
          .eq('id', sourceId);
      };

      // Evaluate skip conditions from notification_rules (module=incident)
      const { data: rules } = await supabaseClient
        .from('notification_rules')
        .select('skip_conditions')
        .eq('module', 'incident')
        .eq('type', type)
        .eq('is_active', true);

      const skipConditions: string[] = rules?.[0]?.skip_conditions ?? [];
      let skipReason: string | null = null;

      for (const condition of skipConditions) {
        if (condition === 'self_action' && actionById && actionById === recipientId) {
          skipReason = condition;
          break;
        }
        if (condition === 'no_email' && (!recipientEmail || String(recipientEmail).trim() === '')) {
          skipReason = condition;
          break;
        }
        if (condition === 'inactive_user') {
          const { data: recipientEmployee } = await supabaseClient
            .from('employees')
            .select('status')
            .eq('id', recipientId)
            .maybeSingle();
          if (!recipientEmployee || !recipientEmployee.status) {
            skipReason = condition;
            break;
          }
        }
        if (condition === 'already_notified') {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recent } = await supabaseClient
            .from('notification_logs')
            .select('created_at')
            .eq('module', 'incident')
            .eq('type', type)
            .eq('recipient_id', recipientId)
            .eq('status', 'sent')
            .gte('created_at', dayAgo)
            .limit(1);
          if (recent && recent.length > 0) {
            skipReason = condition;
            break;
          }
        }
      }

      if (skipReason) {
        await stampSkip(skipReason);
        return new Response(JSON.stringify({ success: true, skipped: true, reason: skipReason }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { subject, body: emailBody } = renderIncidentTemplate(type, variables);

      const { data: queuedEmail, error: queueError } = await supabaseClient
        .from('email_queue')
        .insert({
          module_name: 'incident',
          notification_type: type,
          client_id: clientId,
          recipient_email: recipientEmail?.trim() || null,
          recipient_name: recipientName?.trim() || null,
          subject: subject.trim(),
          body: emailBody.trim(),
          params: { ...variables, module: 'incident', type, priority: notificationPriority },
          priority: notificationPriority === 'high' ? 1 : 0,
          is_sent: false,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      await supabaseClient.from('notification_logs').insert({
        module: 'incident',
        type,
        client_id: clientId,
        recipient_id: recipientId,
        recipient_email: recipientEmail,
        subject,
        body: emailBody,
        status: queueError ? 'failed' : 'pending',
        error_message: queueError ? 'Failed to queue email' : null,
        email_queue_id: queuedEmail?.id ?? null,
        metadata,
      });

      return new Response(JSON.stringify({ success: true, skipped: false, delivered: !queueError }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── get_analytics ────────────────────────────────────────────────────────
    if (operation === 'get_analytics') {
      const { data: incidentsData, error: analyticsError } = await supabaseClient
        .from('incidents')
        .select(`
          *,
          facility:facilities(name),
          category:incident_categories(name),
          subcategory:incident_subcategories(name),
          type:incident_report_types(name),
          status:incident_status(name),
          priority:incident_priorities(name, color),
          assigned_to_user:employees!incidents_assigned_to_fkey(first_name, last_name),
          created_by_user:employees!incidents_created_by_fkey(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      return new Response(JSON.stringify({ success: true, incidents: incidentsData || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── get_learning_points ──────────────────────────────────────────────────
    if (operation === 'get_learning_points') {
      const { data: learningPointsData, error: learningPointsError } = await supabaseClient
        .from('incidents')
        .select(`
          id, ticket_id, learning_points, created_at,
          incident_categories:category_id(name),
          incident_subcategories:subcategory_id(name),
          created_by_employee:employees!created_by(id, first_name, last_name)
        `)
        .eq('client_id', clientId)
        .not('learning_points', 'is', null)
        .neq('learning_points', '')
        .order('created_at', { ascending: false });

      if (learningPointsError) throw learningPointsError;

      return new Response(JSON.stringify({ success: true, data: learningPointsData || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── get_audit_log ────────────────────────────────────────────────────────
    if (operation === 'get_audit_log') {
      if (!incidentId) throw new Error('Incident ID is required');

      const { data: auditLog, error: auditLogError } = await supabaseClient
        .from('incident_audit_log')
        .select(`
          id,
          incident_id,
          client_id,
          field_changed,
          old_value,
          new_value,
          changed_by,
          changed_at,
          change_type,
          description,
          changes,
          created_at
        `)
        .eq('incident_id', incidentId)
        .order('changed_at', { ascending: false });

      if (auditLogError) throw auditLogError;

      const entries = auditLog || [];

      // ── Batch-resolve display labels for the History tab ──────────────────
      // The client used to resolve each entry's `changed_by` name and each
      // changed field's old/new value (status/priority/category/.../assigned_to/
      // facility) with its own direct query per entry per field — one round trip
      // per label. Collect every id this page of entries needs, batch one query
      // per lookup type, and return the resolved maps alongside the raw rows so
      // the client only does synchronous lookups.
      const changedByIds = new Set<string>();
      const fieldLookups: Record<string, Set<string>> = {
        status_id: new Set(), priority_id: new Set(), category_id: new Set(),
        subcategory_id: new Set(), type_id: new Set(), assigned_to: new Set(),
        facility_id: new Set(),
      };

      for (const entry of entries as Record<string, unknown>[]) {
        if (entry.changed_by) changedByIds.add(String(entry.changed_by));

        const collectFieldValue = (field: unknown, value: unknown) => {
          if (typeof field === 'string' && field in fieldLookups && value) {
            fieldLookups[field].add(String(value));
          }
        };

        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes as Record<string, unknown>[]) {
            collectFieldValue(change.field, change.old_value);
            collectFieldValue(change.field, change.new_value);
          }
        } else {
          collectFieldValue(entry.field_changed, entry.old_value);
          collectFieldValue(entry.field_changed, entry.new_value);
        }
      }

      const userNames: Record<string, string> = {};
      if (changedByIds.size > 0) {
        const ids = Array.from(changedByIds);
        const { data: employees } = await supabaseClient
          .from('employees')
          .select('id, user_id, first_name, last_name')
          .or(`user_id.in.(${ids.join(',')}),id.in.(${ids.join(',')})`);

        for (const id of ids) {
          const byUserId = employees?.find((e: { user_id: string }) => e.user_id === id);
          const byId = byUserId ?? employees?.find((e: { id: string }) => e.id === id);
          userNames[id] = byId ? `${byId.first_name} ${byId.last_name}` : 'Unknown User';
        }
      }

      const tableByField: Record<string, { table: string; column: string }> = {
        status_id: { table: 'incident_status', column: 'name' },
        priority_id: { table: 'incident_priorities', column: 'name' },
        category_id: { table: 'incident_categories', column: 'name' },
        subcategory_id: { table: 'incident_subcategories', column: 'name' },
        type_id: { table: 'incident_report_types', column: 'name' },
        facility_id: { table: 'facilities', column: 'name' },
      };

      const fieldValues: Record<string, string> = {};
      await Promise.all(Object.entries(fieldLookups).map(async ([field, values]) => {
        if (values.size === 0) return;
        const uniqueValues = Array.from(values);

        if (field === 'assigned_to') {
          const { data: assignees } = await supabaseClient
            .from('employees')
            .select('id, first_name, last_name')
            .in('id', uniqueValues);
          for (const value of uniqueValues) {
            const match = assignees?.find((e: { id: string }) => e.id === value);
            fieldValues[`${field}:${value}`] = match ? `${match.first_name} ${match.last_name}` : value;
          }
          return;
        }

        const config = tableByField[field];
        const { data: rows } = await supabaseClient.from(config.table).select(`id, ${config.column}`).in('id', uniqueValues);
        for (const value of uniqueValues) {
          const match = (rows as Record<string, unknown>[] | null)?.find((r) => r.id === value);
          fieldValues[`${field}:${value}`] = (match?.[config.column] as string) || value;
        }
      }));

      return new Response(JSON.stringify({ success: true, data: entries, userNames, fieldValues }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── check_references ─────────────────────────────────────────────────────
    // Batched "is this record referenced by any incident/student" check, used to
    // disable delete buttons in configuration screens. Accepts an array of
    // { type, id } pairs and groups the work into one query per type instead of
    // one query per row — replaces the previous client-side pattern of firing
    // Promise.all(list.map(checkXReferences)), which issued one direct REST call
    // per row (and, for contributingFactor/employee/student, fetched every
    // incident's JSONB column once per row on top of that).
    if (operation === 'check_references') {
      const checkList = Array.isArray(checks) ? checks as Array<{ type: string; id: string }> : [];
      const results: Array<{ type: string; id: string; hasReferences: boolean; count: number }> = [];

      const idsByType = new Map<string, string[]>();
      for (const check of checkList) {
        if (!check?.type || !check?.id) continue;
        const list = idsByType.get(check.type) ?? [];
        list.push(check.id);
        idsByType.set(check.type, list);
      }

      const directColumnByType: Record<string, string> = {
        category: 'category_id',
        subcategory: 'subcategory_id',
        priority: 'priority_id',
        reportType: 'type_id',
        facility: 'facility_id',
        location: 'location_id',
      };

      await Promise.all(Array.from(idsByType.entries()).map(async ([type, ids]) => {
        const uniqueIds = Array.from(new Set(ids));

        if (directColumnByType[type]) {
          const column = directColumnByType[type];
          const { data, error } = await supabaseClient
            .from('incidents')
            .select(`id, ${column}`)
            .eq('client_id', clientId)
            .in(column, uniqueIds);
          if (error) throw error;

          const counts = new Map<string, number>();
          for (const row of (data ?? []) as Record<string, unknown>[]) {
            const value = row[column] as string;
            counts.set(value, (counts.get(value) ?? 0) + 1);
          }
          for (const id of uniqueIds) {
            const count = counts.get(id) ?? 0;
            results.push({ type, id, hasReferences: count > 0, count });
          }
          return;
        }

        if (type === 'grade' || type === 'section') {
          const column = type === 'grade' ? 'grade_id' : 'section_id';
          const { data, error } = await supabaseClient
            .from('students')
            .select(`id, ${column}`)
            .eq('client_id', clientId)
            .in(column, uniqueIds);
          if (error) throw error;

          const counts = new Map<string, number>();
          for (const row of (data ?? []) as Record<string, unknown>[]) {
            const value = row[column] as string;
            counts.set(value, (counts.get(value) ?? 0) + 1);
          }
          for (const id of uniqueIds) {
            const count = counts.get(id) ?? 0;
            results.push({ type, id, hasReferences: count > 0, count });
          }
          return;
        }

        if (type === 'contributingFactor') {
          const { data, error } = await supabaseClient
            .from('incidents')
            .select('id, contributing_factor')
            .eq('client_id', clientId)
            .not('contributing_factor', 'is', null);
          if (error) throw error;

          const counts = new Map<string, number>();
          for (const id of uniqueIds) counts.set(id, 0);
          for (const row of (data ?? []) as { contributing_factor: unknown }[]) {
            const factors = Array.isArray(row.contributing_factor) ? row.contributing_factor : [];
            for (const id of uniqueIds) {
              const matches = (factors as Record<string, unknown>[]).some(
                (factor) => String(factor?.id ?? '').trim() === String(id).trim()
              );
              if (matches) counts.set(id, (counts.get(id) ?? 0) + 1);
            }
          }
          for (const id of uniqueIds) {
            const count = counts.get(id) ?? 0;
            results.push({ type, id, hasReferences: count > 0, count });
          }
          return;
        }

        if (type === 'employee' || type === 'student') {
          const role = type === 'employee' ? 'Staff' : 'Student';
          const { data, error } = await supabaseClient
            .from('incidents')
            .select('id, people_involved')
            .eq('client_id', clientId)
            .not('people_involved', 'is', null);
          if (error) throw error;

          const counts = new Map<string, number>();
          for (const id of uniqueIds) counts.set(id, 0);
          for (const row of (data ?? []) as { people_involved: unknown }[]) {
            const people = Array.isArray(row.people_involved) ? row.people_involved : [];
            for (const id of uniqueIds) {
              const matches = (people as Record<string, unknown>[]).some(
                (person) => String(person?.id ?? '').trim() === String(id).trim() && person?.role === role
              );
              if (matches) counts.set(id, (counts.get(id) ?? 0) + 1);
            }
          }
          for (const id of uniqueIds) {
            const count = counts.get(id) ?? 0;
            results.push({ type, id, hasReferences: count > 0, count });
          }
        }
      }));

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── get_incident_detail ──────────────────────────────────────────────────
    if (operation === 'get_incident_detail') {
      if (!incidentId) throw new Error('Incident ID is required');

      let detailQuery = supabaseClient
        .from('incidents')
        .select(`
          *,
          type:type_id(id, name),
          category:category_id(id, name),
          subcategory:subcategory_id(id, name),
          location:location_id(id, name),
          facility:facility_id(id, name),
          priority:priority_id(id, name),
          status:status_id(id, name),
          created_by:employees!created_by(id, first_name, last_name),
          assigned_to:employees!assigned_to(id, first_name, last_name)
        `)
        .eq('id', incidentId)
        .eq('client_id', clientId);

      const { data: incident, error } = await detailQuery.single();

      if (error) throw error;

      let contributingFactorsQuery = supabaseClient
        .from('contributing_factors')
        .select('id, name, weight')
        .eq('client_id', clientId);
      if (clientTypeId) contributingFactorsQuery = contributingFactorsQuery.eq('client_type_id', clientTypeId);

      const { data: contributingFactors, error: cfError } = await contributingFactorsQuery.order('name');

      if (cfError) throw cfError;

      return new Response(JSON.stringify({ success: true, incident, contributingFactors: contributingFactors ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── paginated incident list (default) ────────────────────────────────────
    const isAdmin = isSuperAdmin === true || hasIncidentAdmin === true;

    // Resolve filter IDs in parallel
    const [categoryRes, subcategoryRes, locationRes, facilityRes, priorityRes, statusRes] = await Promise.all([
      (() => {
        if (!category) return Promise.resolve({ data: null });
        let q = supabaseClient.from('incident_categories').select('id').eq('name', category).eq('client_id', clientId);
        if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
        return q.limit(1).maybeSingle();
      })(),
      (() => {
        if (!subcategory) return Promise.resolve({ data: null });
        let q = supabaseClient.from('incident_subcategories').select('id').eq('name', subcategory).eq('client_id', clientId);
        if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
        return q.limit(1).maybeSingle();
      })(),
      (() => {
        if (!location) return Promise.resolve({ data: null });
        let q = supabaseClient.from('campuses').select('id').eq('name', location).eq('client_id', clientId);
        if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
        return q.limit(1).maybeSingle();
      })(),
      (() => {
        if (!facility) return Promise.resolve({ data: null });
        let q = supabaseClient.from('facilities').select('id').eq('name', facility).eq('client_id', clientId);
        if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
        return q.limit(1).maybeSingle();
      })(),
      (() => {
        if (!priority) return Promise.resolve({ data: null });
        let q = supabaseClient.from('incident_priorities').select('id').eq('name', priority).eq('client_id', clientId);
        if (clientTypeId) q = q.eq('client_type_id', clientTypeId);
        return q.limit(1).maybeSingle();
      })(),
      (status && status !== 'Reopen') ? supabaseClient.from('incident_status').select('id').eq('name', status).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    let matchingTypeIds: string[] = [];

      if (search.trim()) {
        const { data: reportTypes } = await supabaseClient
          .from("incident_report_types")
          .select("id")
          .ilike("name", `%${search.trim()}%`);

        matchingTypeIds = reportTypes?.map((x) => x.id) || [];
      }

    let baseQuery = supabaseClient
      .from('incidents')
      .select(`
        id, ticket_id, description, date, people_involved, documents, comments,
        created_at, updated_at, created_by, assigned_to, recommended_action,
        root_cause_analysis, learning_points, action_taken, reopen,
        incident_report_types:type_id(id, name),
        incident_categories:category_id(id, name),
        incident_subcategories:subcategory_id(id, name),
        campuses:location_id(id, name),
        facilities:facility_id(id, name),
        incident_priorities:priority_id(id, name),
        incident_status:status_id(id, name),
        created_by_employee:employees!created_by(id, first_name, last_name),
        assigned_employee:employees!assigned_to(id, first_name, last_name)
      `, { count: 'exact' })
      .eq('client_id', clientId);

    if (!isAdmin && employeeId) {
      baseQuery = baseQuery.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
    }
    if (search.trim()) {
      const text = search.trim();

      const searchFilters = [
        `ticket_id.ilike.%${text}%`,
        `description.ilike.%${text}%`,
        `root_cause_analysis.ilike.%${text}%`,
        `learning_points.ilike.%${text}%`
      ];

      if (matchingTypeIds.length > 0) {
        searchFilters.push(`type_id.in.(${matchingTypeIds.join(",")})`);
      }

      baseQuery = baseQuery.or(searchFilters.join(","));
    }
    
    if (categoryRes.data?.id) baseQuery = baseQuery.eq('category_id', categoryRes.data.id);
    if (subcategoryRes.data?.id) baseQuery = baseQuery.eq('subcategory_id', subcategoryRes.data.id);
    if (locationRes.data?.id) baseQuery = baseQuery.eq('location_id', locationRes.data.id);
    if (facilityRes.data?.id) baseQuery = baseQuery.eq('facility_id', facilityRes.data.id);
    if (priorityRes.data?.id) baseQuery = baseQuery.eq('priority_id', priorityRes.data.id);
    if (status === 'Reopen') {
      baseQuery = baseQuery.eq('reopen', 1);
    } else if (statusRes.data?.id) {
      baseQuery = baseQuery.eq('status_id', statusRes.data.id);
    }
    if (dateFrom) baseQuery = baseQuery.gte('date', dateFrom);
    if (dateTo) baseQuery = baseQuery.lte('date', dateTo);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: incidents, error: incError, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (incError) throw incError;

    // Fetch config alongside incidents for the form dropdowns
    let rtQuery = supabaseClient.from('incident_report_types').select('id, name, description').eq('is_active', true).eq('client_id', clientId);
    if (clientTypeId) rtQuery = rtQuery.eq('client_type_id', clientTypeId);

    let prQuery = supabaseClient.from('incident_priorities').select('id, name, color, weight').eq('is_active', true).eq('client_id', clientId).order('weight', { ascending: true });
    if (clientTypeId) prQuery = prQuery.eq('client_type_id', clientTypeId);

    let catQuery = supabaseClient.from('incident_categories').select('id, name, description').eq('is_active', true).eq('client_id', clientId);
    if (clientTypeId) catQuery = catQuery.eq('client_type_id', clientTypeId);

    let subQuery = supabaseClient.from('incident_subcategories').select('id, name, category_id').eq('is_active', true).eq('client_id', clientId);
    if (clientTypeId) subQuery = subQuery.eq('client_type_id', clientTypeId);

    let locQuery = supabaseClient.from('campuses').select('id, name').eq('client_id', clientId);
    if (clientTypeId) locQuery = locQuery.eq('client_type_id', clientTypeId);

    let facQuery = supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId);
    if (clientTypeId) facQuery = facQuery.eq('client_type_id', clientTypeId);

    let stuQuery = supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false });
    if (clientTypeId) stuQuery = stuQuery.eq('client_type_id', clientTypeId);

    const [rtRes, catRes, subRes, locRes, facRes, prRes, stRes, empRes, stuRes] = await Promise.all([
      rtQuery,
      catQuery,
      subQuery,
      locQuery,
      facQuery,
      prQuery,
      supabaseClient.from('incident_status').select('id, name'),
      supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).not('email', 'is', null).neq('email', ''),
      stuQuery,
    ]);

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return new Response(
      JSON.stringify({
        success: true,
        incidents: incidents || [],
        totalCount,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages,
        config: {
          reportTypes: rtRes.data || [],
          categories: catRes.data || [],
          subcategories: subRes.data || [],
          locations: locRes.data || [],
          facilities: facRes.data || [],
          priorities: prRes.data || [],
          statuses: stRes.data || [],
          employees: empRes.data || [],
          students: stuRes.data || [],
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-incidents function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
