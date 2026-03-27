/**
 * Child Audit — list students for a client with grade/section.
 * - App: POST JSON { client_id, search? } + Authorization Bearer (user JWT).
 * - External API (optional): same body + x-api-key: INTEGRATION_API_KEY when env is set.
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
  client_id: string | null;
  created_at: string;
  updated_at: string;
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
    console.error('child-audit-students employees lookup:', empError);
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
    let search: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      clientId = typeof body.client_id === 'string' ? body.client_id.trim() : null;
      if (!clientId && typeof body.clientId === 'string') clientId = body.clientId.trim();
      search = typeof body.search === 'string' ? body.search.trim() : null;
    } else {
      const url = new URL(req.url);
      clientId = url.searchParams.get('client_id')?.trim() ?? null;
      search = url.searchParams.get('search')?.trim() ?? null;
    }

    if (!clientId) {
      return json(
        {
          ok: false,
          error: 'CLIENT_ID_REQUIRED',
          message: 'client_id is required in the JSON body (POST) or query string (GET)',
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

    let query = supabase
      .from('students')
      .select('id, student_id, name, grade, section, campus, client_id, created_at, updated_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    if (search && search.length > 0) {
      const term = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(
        `name.ilike.%${term}%,student_id.ilike.%${term}%,grade.ilike.%${term}%,section.ilike.%${term}%`
      );
    }

    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      console.error('child-audit-students fetch:', fetchError);
      return json(
        {
          ok: false,
          error: 'DATABASE_ERROR',
          message: fetchError.message,
          version: API_VERSION,
        },
        500
      );
    }

    const students = (rows ?? []) as StudentRow[];
    const data = students.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      name: r.name,
      grade: r.grade ?? null,
      section: r.section ?? null,
      grade_section: buildGradeSection(r.grade, r.section),
      campus: r.campus ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return json({
      ok: true,
      version: API_VERSION,
      client_id: clientId,
      meta: { count: data.length },
      data,
    });
  } catch (e) {
    console.error('child-audit-students:', e);
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
