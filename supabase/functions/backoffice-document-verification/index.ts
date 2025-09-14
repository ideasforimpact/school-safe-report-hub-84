import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyBody {
  documentId: string;
  clientId: string;
  employeeId: string;
  action: 'completed' | 'rejected';
  comments: string;
  attachment?: {
    name: string;
    type: string;
    size: number;
    base64: string; // may include data: prefix
  } | null;
  verifiedBy?: string;
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const storageBase = Deno.env.get('PUBLIC_STORAGE_BASE_URL') || 'https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public';
    const normalizedBase = storageBase.replace(/\/$/, '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyBody = await req.json();
    
    const { documentId, clientId, employeeId, action, comments, attachment, verifiedBy } = body;

    if (!documentId || !clientId || !employeeId || !action || !comments) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    // 4) Optional single attachment upload
    let attachmentPublicUrl: string | undefined;
    let attachmentStoragePath: string | undefined;
    if (attachment && attachment.base64) {
      const base64Data = attachment.base64.split(',')[1] || attachment.base64;
      const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const ts = new Date().getTime();
      const ext = attachment.name.split('.').pop() || 'bin';
      const storagePath = `${clientId}/${employeeId}/${ts}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('employee_other_type_statement')
        .upload(storagePath, binary, { contentType: attachment.type, upsert: true });
      if (uploadErr) {
        return new Response(JSON.stringify({ error: `Upload failed: ${uploadErr.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      attachmentStoragePath = storagePath;
      attachmentPublicUrl = `${normalizedBase}/employee_other_type_statement/${storagePath}`;
    }

    // 5) Build verification history entry
    const existingParams = (doc.params as Record<string, any>) || {};
    const history: any[] = existingParams.verification_history || [];
    const entry = {
      action,
      comments,
      attachments: attachmentPublicUrl ? [attachmentPublicUrl] : [],
      attachment_paths: attachmentStoragePath ? [attachmentStoragePath] : [],
      timestamp: new Date().toISOString(),
      verified_by: verifiedBy || 'SafeSchool'
    };
    const updatedParams = { ...existingParams, verification_history: [...history, entry] };

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


