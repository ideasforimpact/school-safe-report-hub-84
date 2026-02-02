import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
type Provider = 'quickekyc' | 'surepass';

interface AuditPayload {
  employeeId: string;
  documentId: string;
  provider: Provider;
  statusCode?: number;
  message?:string;
  response?: any;
}

function getDateHourKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}`;
}


/**
 * Store SUCCESS audit log
 */
export async function logVerificationSuccess(
  supabase: SupabaseClient,
  payload: AuditPayload
) {
  const dateHourKey = getDateHourKey();
  
  const successPayload = {
    provider: payload.provider,
    status_code: payload.statusCode,
    response: payload.response
  };
  console.log('payload gave success',payload);

  const { data: existing } = await supabase
    .from('employee_verification_audit_log')
    .select('audit_success_log')
    .eq('employee_id', payload.employeeId)
    .eq('document_id', payload.documentId)
    .maybeSingle();

  const auditLog =
    typeof existing?.audit_success_log === 'object' &&
    !Array.isArray(existing.audit_success_log)
      ? existing.audit_success_log
      : {};

  const updatedAuditLog = {
    ...auditLog,
    [dateHourKey]: [
      ...(Array.isArray(auditLog?.[dateHourKey])
        ? auditLog[dateHourKey]
        : []),
      successPayload
    ]
  };


  await supabase
    .from('employee_verification_audit_log')
    .upsert(
      {
        employee_id: payload.employeeId,
        document_id: payload.documentId,
        provider: payload.provider,
        latest_success_log: successPayload,
        audit_success_log: updatedAuditLog,
        latest_status_code: payload.statusCode,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'employee_id,document_id' }
    );
}


/**
 * Store ERROR audit log + both_fallback detection
 */
export async function logVerificationError(
  supabase: SupabaseClient,
  payload: AuditPayload
) {
  const dateHourKey = getDateHourKey();

  const errorPayload = {
    provider: payload.provider,
    status_code: payload.statusCode,
    message: payload.message
  };
  console.log('error payload for all the verification',errorPayload);
  
  const { data: existing } = await supabase
    .from('employee_verification_audit_log')
    .select('audit_error_log')
    .eq('employee_id', payload.employeeId)
    .eq('document_id', payload.documentId)
    .maybeSingle();

  const auditLog =
    typeof existing?.audit_error_log === 'object' &&
    !Array.isArray(existing.audit_error_log)
      ? existing.audit_error_log
      : {};

  const updatedAuditLog = {
    ...auditLog,
    [dateHourKey]: [
      ...(Array.isArray(auditLog?.[dateHourKey])
        ? auditLog[dateHourKey]
        : []),
      errorPayload
    ]
  };


  // Detect both-provider fallback
const providers = new Set<string>();

Object.values(updatedAuditLog).forEach((entries: any) => {
  if (Array.isArray(entries)) {
    entries.forEach((entry) => {
      if (entry?.provider) providers.add(entry.provider);
    });
  }
});


  const bothFallback =
    providers.has('quickekyc') && providers.has('surepass');

  await supabase
    .from('employee_verification_audit_log')
    .upsert(
      {
        employee_id: payload.employeeId,
        document_id: payload.documentId,
        provider: payload.provider,
        latest_error_log: errorPayload,
        audit_error_log: updatedAuditLog,
        both_fallback: bothFallback,
        latest_status_code: payload.statusCode,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'employee_id,document_id' }
    );

  return bothFallback;
}

