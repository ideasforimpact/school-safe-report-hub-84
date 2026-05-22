
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatClientNameForTicketId(clientName: string): string {
  if (!clientName || typeof clientName !== 'string') return 'CLI';
  const clean = clientName.trim().replace(/[^a-zA-Z\s]/g, '');
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 'CLI';
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => w.charAt(0).toUpperCase()).join('');
}

function buildIncidentAssignedEmail(vars: Record<string, string>) {
  const subject = `New Incident Assigned – [Incident ID: ${vars.Incident_ID}]`;
  const body = `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">New Incident Assigned</h2>
</div>
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>${vars.User_Name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">A new incident has been created and assigned to you for follow-up.</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> ${vars.Incident_ID}</p>
<p style="margin:6px 0;"><strong>Title:</strong> ${vars.Incident_Title}</p>
<p style="margin:6px 0;"><strong>Reported On:</strong> ${vars.Reported_Date}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please review and take necessary action. <a href="${vars.Incident_URL}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`;
  return { subject, body };
}

async function handleIncidentAssignedNotification(
  supabaseClient: any,
  opts: {
    incidentId: string;
    ticketId: string;
    clientId: string;
    createdBy: string;
    assignee: { id: string; email: string; first_name: string; last_name: string };
    description: string;
    baseUrl: string;
  }
) {
  const { incidentId, ticketId, clientId, createdBy, assignee, description, baseUrl } = opts;
  try {
    // Skip self-assign
    if (createdBy === assignee.id) return;

    // Check notification rules and skip conditions
    const { data: rules } = await supabaseClient
      .from('notification_rules')
      .select('skip_conditions')
      .eq('module', 'incident')
      .eq('type', 'incident_assigned')
      .eq('is_active', true)
      .limit(1);

    if (rules && rules.length > 0) {
      const skipConditions: string[] = rules[0].skip_conditions || [];

      if (skipConditions.some((c: string) => c.toLowerCase().includes('inactive'))) {
        const { data: emp } = await supabaseClient
          .from('employees')
          .select('status')
          .eq('id', assignee.id)
          .single();
        if (!emp?.status) {
          await supabaseClient.from('notification_logs').insert({
            module: 'incident', type: 'incident_assigned',
            recipient_id: assignee.id, recipient_email: assignee.email,
            subject: '', body: '', status: 'skipped',
            metadata: { skipReason: 'inactive_user', incidentId, reportedBy: createdBy, actionBy: createdBy }
          });
          return;
        }
      }
    }

    const reportedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const { subject, body } = buildIncidentAssignedEmail({
      User_Name: `${assignee.first_name} ${assignee.last_name}`,
      Incident_ID: ticketId,
      Incident_Title: description,
      Reported_Date: reportedDate,
      Incident_URL: `${baseUrl}/incidents/${incidentId}`,
    });

    const { data: emailData } = await supabaseClient
      .from('email_queue')
      .insert({
        module_name: 'incident',
        notification_type: 'incident_assigned',
        client_id: clientId,
        recipient_email: assignee.email,
        recipient_name: `${assignee.first_name} ${assignee.last_name}`,
        subject, body,
        params: { template_id: 'frontend-incident-assigned', module: 'incident', type: 'incident_assigned', priority: 'medium' },
        priority: 0, is_sent: false, retry_count: 0, max_retries: 3,
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    await supabaseClient.from('notification_logs').insert({
      module: 'incident', type: 'incident_assigned',
      recipient_id: assignee.id, recipient_email: assignee.email,
      subject, body,
      status: emailData?.id ? 'pending' : 'failed',
      email_queue_id: emailData?.id || null,
      metadata: { incidentId, reportedBy: createdBy, actionBy: createdBy }
    });
  } catch (err) {
    console.error('handleIncidentAssignedNotification error:', err);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
      clientId,
      clientName,   // passed from frontend (already known from authEmployeeData)
      employeeId,   // creator's employee ID
      incidentRecord, // all incident fields except ticket_id and status_id
      assignee,     // { id, email, first_name, last_name } | null
      notificationBaseUrl,
    } = body;

    if (!clientId) throw new Error('clientId is required');

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(supabaseClient, req, clientId, url.pathname);
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 1. Resolve client name (use passed value, fall back to DB) ───────────
    let resolvedClientName = clientName;
    if (!resolvedClientName) {
      const { data: clientData } = await supabaseClient
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single();
      resolvedClientName = clientData?.name || 'Unknown Client';
    }

    // ── 2. Generate ticket ID ────────────────────────────────────────────────
    const prefix = formatClientNameForTicketId(resolvedClientName);
    const { data: existingTickets } = await supabaseClient
      .from('incidents')
      .select('ticket_id')
      .eq('client_id', clientId)
      .like('ticket_id', `${prefix}-%`)
      .order('ticket_id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existingTickets?.[0]?.ticket_id) {
      const match = existingTickets[0].ticket_id.match(/-(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    const ticketId = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    // ── 3. Resolve Open status ID (use passed value, fall back to DB) ────────
    let statusId = incidentRecord?.status_id;
    if (!statusId) {
      const { data: statusData } = await supabaseClient
        .from('incident_status')
        .select('id')
        .eq('name', 'Open')
        .single();
      if (!statusData) throw new Error('Could not fetch Open incident status');
      statusId = statusData.id;
    }

    // ── 4. Insert incident ───────────────────────────────────────────────────
    const record = incidentRecord
      ? { ...incidentRecord, ticket_id: ticketId, status_id: statusId }
      : {
          // Legacy flat-field support (existing callers)
          ticket_id: ticketId,
          description: body.description || '',
          date: body.date,
          created_by: body.createdBy || employeeId,
          status_id: statusId,
          client_id: clientId,
          people_involved: body.peopleInvolved || [],
          documents: [],
          type_id: body.typeId || null,
          category_id: body.categoryId || null,
          subcategory_id: body.subcategoryId || null,
          location_id: body.locationId || null,
          facility_id: body.facilityId || null,
          priority_id: body.priorityId || null,
          assigned_to: body.assignedTo || null,
        };

    const { data: incident, error: insertError } = await supabaseClient
      .from('incidents')
      .insert(record)
      .select('id, ticket_id')
      .single();

    if (insertError) throw new Error(`Failed to create incident: ${insertError.message}`);

    // ── 5. Queue notification server-side ────────────────────────────────────
    const createdBy = record.created_by || employeeId;
    if (assignee?.id && assignee?.email) {
      await handleIncidentAssignedNotification(supabaseClient, {
        incidentId: incident.id,
        ticketId: incident.ticket_id,
        clientId,
        createdBy,
        assignee,
        description: record.description || 'Incident',
        baseUrl: notificationBaseUrl || '',
      });
    }

    return new Response(
      JSON.stringify({ success: true, incidentId: incident.id, ticketId: incident.ticket_id, incident }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-incident function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
