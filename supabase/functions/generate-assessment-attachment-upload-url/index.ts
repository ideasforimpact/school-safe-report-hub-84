import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// assessment-level (submission/closure) attachments use
// {clientId}/{employeeId}/{assessmentId}/{file}; per-question attachments use
// {clientId}/{employeeId}/{templateName}/question_{n}/attachments/{file}.
const ASSESSMENT_LEVEL_BUCKETS = ['assessment-submission-attachments', 'assessment-closure-attachments'];
const QUESTION_LEVEL_BUCKETS = ['assessment-question-files'];
const ALLOWED_BUCKETS = [...ASSESSMENT_LEVEL_BUCKETS, ...QUESTION_LEVEL_BUCKETS];

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '_')
    .replace(/[—–]/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/[_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Matches generateAttachmentFilePath's sanitization in questionFileService.ts
// (a plainer alphanumeric/hyphen/underscore-only sanitizer than sanitizeFileName).
function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function extractQuestionNumber(questionId: string): string {
  return questionId.match(/question[_-]?(\d+)/)?.[1] || sanitizeSegment(questionId);
}

interface FileResult {
  fileName: string;
  success: boolean;
  path?: string;
  token?: string;
  signedUrl?: string;
  publicUrl?: string;
  error?: string;
}

interface RequestItem {
  key: string;
  bucket: string;
  fileNames: string[];
  templateName?: string;
  questionId?: string;
  assessmentId?: string | number;
}

interface ItemResult {
  key: string;
  success: boolean;
  results?: FileResult[];
  error?: string;
}

// Validates the whole batch up front so a client-side bug (bad bucket,
// missing questionId, duplicate key) fails fast with a clear message
// instead of surfacing as a confusing partial per-item failure.
function validateItems(items: unknown): asserts items is RequestItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Missing items (must be a non-empty array)');
  }

  const seenKeys = new Set<string>();
  items.forEach((item: any, index: number) => {
    const label = `items[${index}]${item?.key ? ` (key: ${item.key})` : ''}`;

    if (!item?.key || typeof item.key !== 'string') {
      throw new Error(`${label}: missing key`);
    }
    if (seenKeys.has(item.key)) {
      throw new Error(`Duplicate key "${item.key}" in items`);
    }
    seenKeys.add(item.key);

    if (!item.bucket || !ALLOWED_BUCKETS.includes(item.bucket)) {
      throw new Error(`${label}: invalid or missing bucket`);
    }
    if (!Array.isArray(item.fileNames) || item.fileNames.length === 0) {
      throw new Error(`${label}: missing fileNames (must be a non-empty array)`);
    }

    if (QUESTION_LEVEL_BUCKETS.includes(item.bucket)) {
      if (!item.templateName) throw new Error(`${label}: missing templateName`);
      if (!item.questionId) throw new Error(`${label}: missing questionId`);
    } else {
      if (!item.assessmentId) throw new Error(`${label}: missing assessmentId`);
    }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Act as the calling user (not service role) so get_current_user_client_id()/
    // get_current_user_employee_id() resolve their real session, and the
    // eventual signed-upload insert is still governed by the exact same
    // storage RLS policies a direct client-side upload would be — we never
    // trust a client-supplied clientId/employeeId for path construction.
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers: { Authorization: authHeader } },
    });

    const { items } = await req.json();
    validateItems(items);

    // Resolved once for the whole batch — previously each caller made its
    // own separate edge-function invocation (one per question, plus one for
    // the general attachment), each redundantly re-resolving these two RPCs.
    const [{ data: clientId, error: clientErr }, { data: employeeId, error: employeeErr }] = await Promise.all([
      supabase.rpc('get_current_user_client_id'),
      supabase.rpc('get_current_user_employee_id'),
    ]);

    if (clientErr || !clientId) {
      throw new Error(clientErr?.message || 'Unable to resolve current client');
    }
    if (employeeErr || !employeeId) {
      throw new Error(employeeErr?.message || 'Unable to resolve current employee');
    }

    const results: ItemResult[] = await Promise.all(
      items.map(async (item): Promise<ItemResult> => {
        try {
          const isQuestionLevel = QUESTION_LEVEL_BUCKETS.includes(item.bucket);
          const basePath = isQuestionLevel
            ? `${clientId}/${employeeId}/${sanitizeSegment(item.templateName!)}/question_${extractQuestionNumber(item.questionId!)}/attachments`
            : `${clientId}/${employeeId}/${item.assessmentId}`;

          const fileResults: FileResult[] = await Promise.all(
            item.fileNames.map(async (fileName: string, index: number): Promise<FileResult> => {
              try {
                if (!fileName) {
                  return { fileName, success: false, error: 'Missing fileName' };
                }

                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const sanitizedFileName = sanitizeFileName(fileName);
                const uniqueFileName = `${timestamp}_${index}_${randomSuffix}_${sanitizedFileName}`;
                const path = `${basePath}/${uniqueFileName}`;

                const { data: signedData, error: signedError } = await supabase.storage
                  .from(item.bucket)
                  .createSignedUploadUrl(path);

                if (signedError || !signedData) {
                  return { fileName, success: false, error: signedError?.message || 'Failed to create signed upload URL' };
                }

                const { data: publicUrlData } = supabase.storage.from(item.bucket).getPublicUrl(path);

                return {
                  fileName,
                  success: true,
                  path,
                  token: signedData.token,
                  signedUrl: signedData.signedUrl,
                  publicUrl: publicUrlData.publicUrl,
                };
              } catch (fileError: any) {
                return { fileName, success: false, error: String(fileError?.message || fileError) };
              }
            })
          );

          return { key: item.key, success: true, results: fileResults };
        } catch (itemError: any) {
          return { key: item.key, success: false, error: String(itemError?.message || itemError) };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating assessment attachment upload URLs:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
