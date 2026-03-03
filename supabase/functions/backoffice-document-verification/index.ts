import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommentEntry {
  text: string;
  sentiment: 'positive' | 'negative';
  attachments: Array<{
    name: string;
    type: string;
    size: number;
    base64: string; // may include data: prefix
  }>;
}

interface VerifyBody {
  documentId: string;
  clientId: string;
  employeeId: string;
  action: 'completed' | 'rejected';
  comments: CommentEntry[] | string; // Support both old format (string) and new format (array)
  attachment?: {
    name: string;
    type: string;
    size: number;
    base64: string; // may include data: prefix
  } | null;
  verifiedBy?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseServiceKey = getSupabaseServiceRoleKey();
    const storageBase = Deno.env.get('PUBLIC_STORAGE_BASE_URL');
    const normalizedBase = storageBase.replace(/\/$/, '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyBody = await req.json();
    
    const { documentId, clientId, employeeId, action, comments, attachment, verifiedBy } = body;

    if (!documentId || !clientId || !employeeId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Normalize comments to array format (support backward compatibility)
    let commentsArray: CommentEntry[];
    if (typeof comments === 'string') {
      // Old format: single comment string
      commentsArray = [{
        text: comments,
        sentiment: action === 'completed' ? 'positive' : 'negative', // Default sentiment based on action
        attachments: attachment ? [attachment] : []
      }];
    } else if (Array.isArray(comments) && comments.length > 0) {
      // New format: array of comments
      commentsArray = comments;
    } else {
      return new Response(JSON.stringify({ error: 'Comments are required and must be non-empty' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1) Validate document belongs to employee
    const { data: doc, error: docErr } = await supabase
      .from('employee_documents')
      .select('id, employee_id, params')
      .eq('id', documentId)
      .eq('employee_id', employeeId)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found or access denied' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Validate employee belongs to client
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, client_id')
      .eq('id', employeeId)
      .eq('client_id', clientId)
      .single();
    if (empErr || !emp) {
      return new Response(JSON.stringify({ error: 'Employee does not belong to client' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3) Status ID mapping
    const statusName = action === 'completed' ? 'completed' : 'rejected';
    const { data: status, error: statusErr } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', statusName)
      .single();
    if (statusErr || !status) {
      return new Response(JSON.stringify({ error: `${statusName} status not found` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4) Process all comments and upload their attachments
    const existingParams = (doc.params as Record<string, any>) || {};
    const history: any[] = existingParams.verification_history || [];
    const newEntries: any[] = [];

    for (const comment of commentsArray) {
      const attachmentUrls: string[] = [];
      const attachmentPaths: string[] = [];

      // Upload all attachments for this comment
      for (const att of comment.attachments) {
        if (att && att.base64) {
          const base64Data = att.base64.split(',')[1] || att.base64;
          const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const ts = new Date().getTime();
          const random = Math.random().toString(36).substring(7);
          const ext = att.name.split('.').pop() || 'bin';
          const storagePath = `${clientId}/${employeeId}/${ts}_${random}.${ext}`;
          
          const { error: uploadErr } = await supabase.storage
            .from('employee_other_type_statement')
            .upload(storagePath, binary, { contentType: att.type, upsert: true });
          
          if (uploadErr) {
            console.error(`Upload failed for ${att.name}:`, uploadErr);
            // Continue with other attachments even if one fails
          } else {
            attachmentPaths.push(storagePath);
            attachmentUrls.push(`${normalizedBase}/employee_other_type_statement/${storagePath}`);
          }
        }
      }

      // Create verification history entry for this comment
    const entry = {
      action,
        comments: comment.text,
        sentiment: comment.sentiment,
        attachments: attachmentUrls,
        attachment_paths: attachmentPaths,
      timestamp: new Date().toISOString(),
      verified_by: verifiedBy || 'SafeSchool'
    };
      newEntries.push(entry);
    }

    // 5) Update verification history with all new entries
    const updatedParams = { ...existingParams, verification_history: [...history, ...newEntries] };

    // 6) Update document
    const { data: updated, error: updErr } = await supabase
      .from('employee_documents')
      .update({
        verification_status: action,
        document_status_id: status.id,
        params: updatedParams,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updErr) {
      return new Response(JSON.stringify({ error: `Update failed: ${updErr.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, document: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = (e as Error).message || 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


