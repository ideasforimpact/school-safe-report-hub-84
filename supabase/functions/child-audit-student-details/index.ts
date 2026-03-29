/**
 * Child Audit — fetch one student detail with check-type-wise lookup payload.
 *
 * Request:
 * - POST JSON: { client_id, student_id }
 * - GET query : ?client_id=<uuid>&student_id=<uuid>
 *
 * Response:
 * {
 *   ok: true,
 *   version: 1,
 *   client_id,
 *   student: {...},
 *   check_type: [
 *     {
 *       id, type, key, active, attachements, alt_definition,
 *       lookup_groups: [{ item_group, type, condition, values: [{ id, label, active }] }]
 *     }
 *   ]
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const API_VERSION = 1;

type StudentRow = {
  id: string;
  student_id: string;
  name: string;
  grade: string | null;
  section: string | null;
  campus: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
};

type CheckTypeRow = {
  id: string;
  client_id: string;
  type: string;
  key: string;
  alt_definition: unknown;
  active: boolean;
  attachements: unknown;
};

type LookupRow = {
  id: string;
  client_id: string;
  item_group: string;
  type: string;
  label: string;
  active: boolean;
  definition: string | null;
};

type AltDefinitionItem = {
  type?: string;
  table?: string;
  condition?: string;
  item_group?: string;
};

type LatestSelection = {
  record_id: string;
  check_type_id: string | null;
  physical_condition_ids: string[];
  behaviour_ids: string[];
  aggression_ids: string[];
  meltdown_occurred: boolean;
  notes: string | null;
  physical_where: Record<string, string[]>;
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildGradeSection(grade: string | null, section: string | null): string {
  const g = (grade ?? '').trim();
  const s = (section ?? '').trim();
  if (g && s) return `${g} - ${s}`;
  return g || s || '—';
}

function normalizeGroupKey(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_').replace(/[^a-z0-9_]/g, '');
}

function parseAltDefinition(value: unknown): AltDefinitionItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        type: typeof record.type === 'string' ? record.type : undefined,
        table: typeof record.table === 'string' ? record.table : undefined,
        condition: typeof record.condition === 'string' ? record.condition : undefined,
        item_group: typeof record.item_group === 'string' ? record.item_group : undefined,
      };
    });
}

function parseItemGroupFromCondition(condition?: string): string | null {
  if (!condition) return null;
  const match = condition.match(/item_group\s*=\s*'([^']+)'/i);
  if (!match || !match[1]) return null;
  return match[1];
}

async function authorizeRequest(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  clientId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const apiKey = req.headers.get('x-api-key');
  const integrationKey = Deno.env.get('INTEGRATION_API_KEY');

  if (apiKey && integrationKey && apiKey === integrationKey) {
    return { ok: true };
  }

  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    return { ok: false, status: 401, message: 'Missing or invalid authorization' };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user?.id) {
    return { ok: false, status: 401, message: 'Invalid session' };
  }

  const uid = userData.user.id;
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, client_id, is_super_admin, status')
    .eq('user_id', uid)
    .limit(5);

  if (empError) {
    console.error('child-audit-student-details employees lookup:', empError);
    return { ok: false, status: 500, message: 'Authorization check failed' };
  }

  const active = (employees ?? []).filter((e: { status?: boolean }) => e.status !== false);
  if (active.length === 0) {
    return { ok: false, status: 403, message: 'No active employee for this user' };
  }

  const allowed = active.some(
    (e: { client_id: string | null; is_super_admin?: boolean }) =>
      e.is_super_admin === true || e.client_id === clientId
  );
  if (!allowed) {
    return { ok: false, status: 403, message: 'Not allowed for this client' };
  }

  return { ok: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: 'Use GET or POST' }, 405);
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    let clientId: string | null = null;
    let studentId: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      clientId = typeof body.client_id === 'string' ? body.client_id.trim() : null;
      if (!clientId && typeof body.clientId === 'string') clientId = body.clientId.trim();

      studentId = typeof body.student_id === 'string' ? body.student_id.trim() : null;
      if (!studentId && typeof body.studentId === 'string') studentId = body.studentId.trim();
    } else {
      const url = new URL(req.url);
      clientId = url.searchParams.get('client_id')?.trim() ?? null;
      studentId = url.searchParams.get('student_id')?.trim() ?? null;
    }

    if (!clientId) {
      return json(
        {
          ok: false,
          error: 'CLIENT_ID_REQUIRED',
          message: 'client_id is required in request body (POST) or query string (GET)',
          version: API_VERSION,
        },
        400
      );
    }

    if (!studentId) {
      return json(
        {
          ok: false,
          error: 'STUDENT_ID_REQUIRED',
          message: 'student_id is required in request body (POST) or query string (GET)',
          version: API_VERSION,
        },
        400
      );
    }

    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
    if (!ipValidation.allowed) {
      return json(
        {
          ok: false,
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.',
          version: API_VERSION,
        },
        403
      );
    }

    const auth = await authorizeRequest(supabase, req, clientId);
    if (!auth.ok) {
      return json(
        { ok: false, error: 'UNAUTHORIZED', message: auth.message, version: API_VERSION },
        auth.status
      );
    }

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, name, grade, section, campus, client_id, created_at, updated_at')
      .eq('client_id', clientId)
      .eq('id', studentId)
      .single();

    if (studentError) {
      return json(
        {
          ok: false,
          error: 'STUDENT_FETCH_FAILED',
          message: studentError.message,
          version: API_VERSION,
        },
        500
      );
    }

    const student = studentData as StudentRow | null;
    if (!student) {
      return json(
        {
          ok: false,
          error: 'STUDENT_NOT_FOUND',
          message: 'No student found for the given student_id and client_id',
          version: API_VERSION,
        },
        404
      );
    }

    const { data: checkTypeRows, error: checkTypeError } = await supabase
      .from('child_audit_check_type')
      .select('id, client_id, type, key, alt_definition, active, attachements')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (checkTypeError) {
      return json(
        {
          ok: false,
          error: 'CHECK_TYPE_FETCH_FAILED',
          message: checkTypeError.message,
          version: API_VERSION,
        },
        500
      );
    }

    const checkTypes = (checkTypeRows ?? []) as CheckTypeRow[];
    const checkTypePayload = [] as Array<Record<string, unknown>>;

    for (const checkType of checkTypes) {
      const alt = parseAltDefinition(checkType.alt_definition);
      const lookupGroups = [] as Array<Record<string, unknown>>;

      for (const definition of alt) {
        const sourceTable = (definition.table ?? '').trim().toLowerCase();
        if (sourceTable !== 'child_audit_look_up') {
          lookupGroups.push({
            item_group: definition.item_group ?? null,
            type: definition.type ?? checkType.key,
            condition: definition.condition ?? null,
            values: [],
            warning: `Unsupported table in alt_definition: ${definition.table ?? 'unknown'}`,
          });
          continue;
        }

        const conditionGroup = parseItemGroupFromCondition(definition.condition);
        const groupKeyFromAlt = normalizeGroupKey(definition.item_group);
        const groupKeyFromCondition = normalizeGroupKey(conditionGroup);
        const groupKey = groupKeyFromCondition || groupKeyFromAlt;
        const lookupType = (definition.type ?? checkType.key).trim();

        let lookupQuery = supabase
          .from('child_audit_look_up')
          .select('id, client_id, item_group, type, label, active, definition')
          .eq('client_id', clientId)
          .eq('type', lookupType)
          .order('label', { ascending: true });

        if (groupKey) {
          lookupQuery = lookupQuery.eq('item_group', groupKey);
        }

        // Keep active filtering aligned with current expectations.
        lookupQuery = lookupQuery.eq('active', true);

        const { data: lookupRows, error: lookupError } = await lookupQuery;
        if (lookupError) {
          lookupGroups.push({
            item_group: (definition.item_group ?? groupKey) || null,
            type: lookupType,
            condition: definition.condition ?? null,
            values: [],
            error: lookupError.message,
          });
          continue;
        }

        const values = ((lookupRows ?? []) as LookupRow[]).map((row) => ({
          id: row.id,
          label: row.label,
          active: row.active,
          item_group: row.item_group,
          type: row.type,
          definition: row.definition ?? null,
        }));

        lookupGroups.push({
          item_group: (definition.item_group ?? groupKey) || null,
          type: lookupType,
          condition: definition.condition ?? null,
          values,
        });
      }

      checkTypePayload.push({
        id: checkType.id,
        type: checkType.type,
        key: checkType.key,
        active: checkType.active,
        attachements: checkType.attachements ?? [],
        alt_definition: alt,
        lookup_groups: lookupGroups,
      });
    }

    let latestSelection: LatestSelection | null = null;
    const { data: latestRecord } = await supabase
      .from('child_audit_record')
      .select('id, check_type_id, notes')
      .eq('client_id', clientId)
      .eq('student_id', studentId)
      .order('submission_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRecord?.id) {
      const { data: latestItems } = await supabase
        .from('child_audit_record_item')
        .select('id, lookup_id, item_group')
        .eq('record_id', latestRecord.id);

      const itemRows =
        (latestItems as Array<{ id: string; lookup_id: string | null; item_group: string }> | null) ?? [];

      const physical_condition_ids = itemRows
        .filter((item) => item.item_group === 'physical_condition' && item.lookup_id)
        .map((item) => item.lookup_id as string);

      const aggression_ids = itemRows
        .filter((item) => item.item_group === 'aggression' && item.lookup_id)
        .map((item) => item.lookup_id as string);

      const meltdown_occurred = itemRows.some((item) => item.item_group === 'meltdown');

      const behaviour_ids = itemRows
        .filter(
          (item) =>
            item.item_group !== 'physical_condition' &&
            item.item_group !== 'aggression' &&
            item.item_group !== 'meltdown' &&
            item.lookup_id
        )
        .map((item) => item.lookup_id as string);

      const recordItemIds = itemRows.map((item) => item.id);
      const physical_where: Record<string, string[]> = {};

      if (recordItemIds.length > 0) {
        const { data: locations } = await supabase
          .from('child_audit_record_item_location')
          .select('record_item_id, body_part')
          .in('record_item_id', recordItemIds);

        const locationRows =
          (locations as Array<{ record_item_id: string; body_part: string }> | null) ?? [];
        const byRecordItemId = new Map<string, string[]>();

        for (const row of locationRows) {
          const list = byRecordItemId.get(row.record_item_id) ?? [];
          list.push(row.body_part);
          byRecordItemId.set(row.record_item_id, list);
        }

        for (const item of itemRows) {
          if (item.item_group !== 'physical_condition' || !item.lookup_id) continue;
          const parts = byRecordItemId.get(item.id) ?? [];
          if (parts.length > 0) {
            physical_where[item.lookup_id] = parts;
          }
        }
      }

      latestSelection = {
        record_id: latestRecord.id,
        check_type_id: latestRecord.check_type_id ?? null,
        physical_condition_ids,
        behaviour_ids,
        aggression_ids,
        meltdown_occurred,
        notes: latestRecord.notes ?? null,
        physical_where,
      };
    }

    return json({
      ok: true,
      version: API_VERSION,
      client_id: clientId,
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        grade_section: buildGradeSection(student.grade, student.section),
        campus: student.campus,
        created_at: student.created_at,
        updated_at: student.updated_at,
      },
      check_type: checkTypePayload,
      latest_selection: latestSelection,
    });
  } catch (e) {
    console.error('child-audit-student-details:', e);
    return json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Unexpected error',
        version: API_VERSION,
      },
      500
    );
  }
});
