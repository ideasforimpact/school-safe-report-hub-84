import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const API_VERSION = 1;

type SaveCheckRequest = {
  client_id: string;
  student_id: string;
  employee_id?: string | null;
  check_type_id: string;
  physical_condition_ids?: string[];
  behaviour_ids?: string[];
  aggression_ids?: string[];
  meltdown_occurred?: boolean;
  meltdown_definition?: string[];
  notes?: string | null;
  physical_where?: Record<string, string[]>;
  attachments?: Array<{
    bucket?: string;
    file_path?: string;
    file_name: string;
    mime_type?: string | null;
    file_size?: number | null;
    base64?: string;
  }>;
};

type LookupRow = {
  id: string;
  client_id: string;
  type: string;
  item_group: string;
  label: string;
  active: boolean;
  definition: string | null;
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toUniqueIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const ids = values
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return [...new Set(ids)];
}

function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex).toLowerCase() : '';

  const sanitizedName = name
    .replace(/ /g, '_')
    .replace(/[()]/g, '_')
    .replace(/[–—]/g, '-')
    .replace(/[[\]{}#%^&*+=|<>?/\\]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${sanitizedName || 'attachment'}${extension}`;
}

function decodeBase64Payload(base64Value: string): Uint8Array {
  const payload = base64Value.includes(',') ? base64Value.split(',')[1] : base64Value;
  const binaryString = atob(payload);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function detectMimeFromDataUrl(base64Value: string): string | null {
  const match = base64Value.match(/^data:([^;]+);base64,/i);
  if (!match) return null;
  return match[1]?.toLowerCase() ?? null;
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
    console.error('child-audit-save-check employees lookup:', empError);
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

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: 'Use POST' }, 405);
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const body = (await req.json().catch(() => ({}))) as Partial<SaveCheckRequest>;

    const clientId = typeof body.client_id === 'string' ? body.client_id.trim() : '';
    const studentId = typeof body.student_id === 'string' ? body.student_id.trim() : '';
    const checkTypeId = typeof body.check_type_id === 'string' ? body.check_type_id.trim() : '';

    if (!clientId || !studentId || !checkTypeId) {
      return json(
        {
          ok: false,
          error: 'VALIDATION_ERROR',
          message: 'client_id, student_id and check_type_id are required',
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

    const physicalIds = toUniqueIds(body.physical_condition_ids);
    const behaviourIds = toUniqueIds(body.behaviour_ids);
    const aggressionIds = toUniqueIds(body.aggression_ids);
    const meltdownOccurred = body.meltdown_occurred === true;
    const meltdownDefinition = toUniqueIds(body.meltdown_definition);
    const inputAttachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (inputAttachments.length > 5) {
      return json(
        {
          ok: false,
          error: 'ATTACHMENT_LIMIT_EXCEEDED',
          message: 'Maximum 5 attachments are allowed',
          version: API_VERSION,
        },
        400
      );
    }

    const { data: checkType, error: checkTypeError } = await supabase
      .from('child_audit_check_type')
      .select('id, client_id, key, type, active')
      .eq('id', checkTypeId)
      .eq('client_id', clientId)
      .single();

    if (checkTypeError || !checkType) {
      return json(
        {
          ok: false,
          error: 'CHECK_TYPE_NOT_FOUND',
          message: checkTypeError?.message ?? 'Check type not found for this client',
          version: API_VERSION,
        },
        404
      );
    }

    const selectedLookupIds = [...new Set([...physicalIds, ...behaviourIds, ...aggressionIds])];
    const selectedLookupMap = new Map<string, LookupRow>();

    if (selectedLookupIds.length > 0) {
      const { data: lookupRows, error: lookupError } = await supabase
        .from('child_audit_look_up')
        .select('id, client_id, type, item_group, label, active, definition')
        .eq('client_id', clientId)
        .in('id', selectedLookupIds);

      if (lookupError) {
        return json(
          {
            ok: false,
            error: 'LOOKUP_FETCH_FAILED',
            message: lookupError.message,
            version: API_VERSION,
          },
          500
        );
      }

      for (const row of (lookupRows ?? []) as LookupRow[]) {
        selectedLookupMap.set(row.id, row);
      }
    }

    const missingIds = selectedLookupIds.filter((id) => !selectedLookupMap.has(id));
    if (missingIds.length > 0) {
      return json(
        {
          ok: false,
          error: 'LOOKUP_NOT_FOUND',
          message: `Some selected lookup values were not found: ${missingIds.join(', ')}`,
          version: API_VERSION,
        },
        400
      );
    }

    // Replace mode:
    // keep only the latest submitted snapshot per student + check type.
    // Delete previous rows before creating the new record.
    const { data: existingRows, error: existingRowsError } = await supabase
      .from('child_audit_record')
      .select('id')
      .eq('client_id', clientId)
      .eq('student_id', studentId)
      .eq('check_type_id', checkType.id);

    if (existingRowsError) {
      return json(
        {
          ok: false,
          error: 'RECORD_FETCH_FAILED',
          message: existingRowsError.message,
          version: API_VERSION,
        },
        500
      );
    }

    const existingIds = (existingRows ?? [])
      .map((row: { id?: string | null }) => row.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (existingIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('child_audit_record')
        .delete()
        .eq('client_id', clientId)
        .eq('student_id', studentId)
        .eq('check_type_id', checkType.id);

      if (deleteError) {
        return json(
          {
            ok: false,
            error: 'RECORD_DELETE_FAILED',
            message: deleteError.message,
            version: API_VERSION,
          },
          500
        );
      }
    }

    const { data: recordData, error: recordError } = await supabase
      .from('child_audit_record')
      .insert({
        client_id: clientId,
        student_id: studentId,
        employee_id: body.employee_id ?? null,
        check_type_id: checkType.id,
        check_type_key: checkType.key,
        check_type_name: checkType.type,
        notes: body.notes?.trim() ? body.notes.trim() : null,
      })
      .select('*')
      .single();

    if (recordError || !recordData) {
      return json(
        {
          ok: false,
          error: 'RECORD_INSERT_FAILED',
          message: recordError?.message ?? 'Unable to insert child audit record',
          version: API_VERSION,
        },
        500
      );
    }

    const itemInserts: Array<Record<string, unknown>> = [];
    const pushItems = (ids: string[]) => {
      for (const id of ids) {
        const row = selectedLookupMap.get(id);
        if (!row) continue;
        itemInserts.push({
          record_id: recordData.id,
          client_id: clientId,
          lookup_id: row.id,
          check_type_key: checkType.key,
          item_group: row.item_group,
          item_label: row.label,
          lookup_definition: row.definition ?? null,
          is_selected: true,
        });
      }
    };

    pushItems(physicalIds);
    pushItems(behaviourIds);
    pushItems(aggressionIds);

    if (meltdownOccurred) {
      const { data: meltdownRow } = await supabase
        .from('child_audit_look_up')
        .select('id, client_id, type, item_group, label, active, definition')
        .eq('client_id', clientId)
        .eq('type', checkType.key)
        .eq('item_group', 'meltdown')
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (meltdownRow) {
        itemInserts.push({
          record_id: recordData.id,
          client_id: clientId,
          lookup_id: meltdownRow.id,
          check_type_key: checkType.key,
          item_group: meltdownRow.item_group,
          item_label: meltdownRow.label,
          lookup_definition: meltdownRow.definition ?? null,
          is_selected: true,
        });
      }
    }

    let insertedItems: Array<{ id: string; lookup_id: string | null; item_group: string }> = [];
    if (itemInserts.length > 0) {
      const { data: inserted, error: itemInsertError } = await supabase
        .from('child_audit_record_item')
        .insert(itemInserts)
        .select('id, lookup_id, item_group');

      if (itemInsertError) {
        return json(
          {
            ok: false,
            error: 'ITEM_INSERT_FAILED',
            message: itemInsertError.message,
            version: API_VERSION,
          },
          500
        );
      }
      insertedItems = (inserted ?? []) as Array<{ id: string; lookup_id: string | null; item_group: string }>;
    }

    const physicalWhere = body.physical_where ?? {};
    const locationInserts: Array<Record<string, unknown>> = [];

    for (const item of insertedItems) {
      let parts: string[] = [];
      if (item.item_group === 'physical_condition' && item.lookup_id) {
        parts = Array.isArray(physicalWhere[item.lookup_id]) ? physicalWhere[item.lookup_id] : [];
      } else if (item.item_group === 'meltdown') {
        parts = meltdownDefinition;
      } else {
        continue;
      }

      for (const part of parts) {
        if (typeof part !== 'string') continue;
        const trimmed = part.trim();
        if (!trimmed) continue;
        locationInserts.push({
          record_item_id: item.id,
          client_id: clientId,
          body_part: trimmed,
        });
      }
    }

    if (locationInserts.length > 0) {
      const { error: locationError } = await supabase
        .from('child_audit_record_item_location')
        .insert(locationInserts);

      if (locationError) {
        return json(
          {
            ok: false,
            error: 'LOCATION_INSERT_FAILED',
            message: locationError.message,
            version: API_VERSION,
          },
          500
        );
      }
    }

    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ]);
    const maxAttachmentSize = 5 * 1024 * 1024;
    const attachmentInserts: Array<Record<string, unknown>> = [];
    const uploadedPathsByBucket = new Map<string, string[]>();

    for (const file of inputAttachments) {
      if (!file || typeof file.file_name !== 'string' || !file.file_name.trim()) {
        return json(
          {
            ok: false,
            error: 'ATTACHMENT_VALIDATION_ERROR',
            message: 'Each attachment must include a valid file_name',
            version: API_VERSION,
          },
          400
        );
      }
      if (typeof file.base64 !== 'string' || !file.base64.trim()) {
        return json(
          {
            ok: false,
            error: 'ATTACHMENT_VALIDATION_ERROR',
            message: `Attachment "${file.file_name}" is missing base64 content`,
            version: API_VERSION,
          },
          400
        );
      }

      const bucket =
        typeof file.bucket === 'string' && file.bucket.trim() ? file.bucket.trim() : 'child_audit_attachements';

      const decodedBytes = (() => {
        try {
          return decodeBase64Payload(file.base64 as string);
        } catch {
          return null;
        }
      })();

      if (!decodedBytes) {
        return json(
          {
            ok: false,
            error: 'ATTACHMENT_VALIDATION_ERROR',
            message: `Attachment "${file.file_name}" has invalid base64 content`,
            version: API_VERSION,
          },
          400
        );
      }

      const sizeBytes = decodedBytes.byteLength;
      if (sizeBytes > maxAttachmentSize) {
        return json(
          {
            ok: false,
            error: 'ATTACHMENT_FILE_TOO_LARGE',
            message: `Attachment "${file.file_name}" exceeds the 5MB limit`,
            version: API_VERSION,
          },
          400
        );
      }

      const mimeType =
        (typeof file.mime_type === 'string' && file.mime_type.trim() ? file.mime_type.trim().toLowerCase() : null) ??
        detectMimeFromDataUrl(file.base64);
      if (!mimeType || !allowedMimeTypes.has(mimeType)) {
        return json(
          {
            ok: false,
            error: 'ATTACHMENT_FILE_TYPE_NOT_ALLOWED',
            message: `Attachment "${file.file_name}" has unsupported file type`,
            version: API_VERSION,
          },
          400
        );
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = sanitizeFilename(file.file_name);
      const objectPath = `${clientId}/${studentId}/${recordData.id}/${timestamp}_${crypto.randomUUID()}_${safeName}`;

      const { error: storageUploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, decodedBytes, { contentType: mimeType, upsert: false });

      if (storageUploadError) {
        // best-effort cleanup of already uploaded files for this request
        for (const [uploadedBucket, uploadedPaths] of uploadedPathsByBucket.entries()) {
          if (uploadedPaths.length === 0) continue;
          await supabase.storage.from(uploadedBucket).remove(uploadedPaths);
        }

        return json(
          {
            ok: false,
            error: 'ATTACHMENT_UPLOAD_FAILED',
            message: `Failed to upload "${file.file_name}": ${storageUploadError.message}`,
            version: API_VERSION,
          },
          500
        );
      }

      const previousPaths = uploadedPathsByBucket.get(bucket) ?? [];
      previousPaths.push(objectPath);
      uploadedPathsByBucket.set(bucket, previousPaths);

      attachmentInserts.push({
        record_id: recordData.id,
        client_id: clientId,
        bucket,
        file_path: objectPath,
        file_name: file.file_name,
        mime_type: mimeType,
        file_size: sizeBytes,
      });
    }

    if (attachmentInserts.length > 0) {
      const { error: attachmentError } = await supabase
        .from('child_audit_record_attachment')
        .insert(attachmentInserts);

      if (attachmentError) {
        // best-effort cleanup of uploaded objects if DB insert fails
        for (const [uploadedBucket, uploadedPaths] of uploadedPathsByBucket.entries()) {
          if (uploadedPaths.length === 0) continue;
          await supabase.storage.from(uploadedBucket).remove(uploadedPaths);
        }

        return json(
          {
            ok: false,
            error: 'ATTACHMENT_INSERT_FAILED',
            message: attachmentError.message,
            version: API_VERSION,
          },
          500
        );
      }
    }

    return json({
      ok: true,
      version: API_VERSION,
      record: {
        id: recordData.id,
        client_id: clientId,
        student_id: studentId,
        employee_id: body.employee_id ?? null,
        check_type_id: checkType.id,
        physical_condition_ids: physicalIds,
        behaviour_ids: behaviourIds,
        meltdown_occurred: meltdownOccurred,
        meltdown_definition: meltdownDefinition,
        aggression_ids: aggressionIds,
        notes: recordData.notes,
        created_at: recordData.submission_time,
        updated_at: recordData.updated_at,
      },
    });
  } catch (e) {
    console.error('child-audit-save-check:', e);
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
