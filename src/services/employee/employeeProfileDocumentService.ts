import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseUrl } from '@/types/fileTypes';

export type ProfileDocumentRow = {
  id: string;
  label: string;
  fileName: string;
  bucket: string;
  storagePath?: string;
};

export type VerificationDocumentRow = {
  id: string;
  typeLabel: string;
  documentUrl: string;
  fileName: string;
  status: 'verified' | 'pending';
};

function formatVerificationTypeName(raw: string) {
  return raw
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fileNameFromVerificationUrl(url: string) {
  if (!url) return 'document';
  if (url.startsWith('data:')) return 'document';
  const clean = url.split('?')[0];
  const seg = clean.split('/').pop() || '';
  const name = seg.includes('_') ? seg.substring(seg.indexOf('_') + 1) : seg;
  return name || 'document';
}

function mapVerificationRows(rows: any[]): VerificationDocumentRow[] {
  return (rows || [])
    .filter((row: any) => row.document_url && String(row.document_url).trim() !== '')
    .map((row: any) => ({
      id: row.id as string,
      typeLabel: formatVerificationTypeName((row.document_type as { name?: string })?.name || 'Document'),
      documentUrl: row.document_url as string,
      fileName: fileNameFromVerificationUrl(row.document_url as string),
      status:
        row.verification_status === 'verified' || row.verification_status === 'completed'
          ? 'verified'
          : 'pending',
    }));
}

export async function fetchEmployeeProfileDocuments(
  employeeId: string,
  clientId?: string
): Promise<ProfileDocumentRow[]> {
  const payload: Record<string, string> = { employeeId };
  if (clientId) payload.clientId = clientId;

  const { data, error } = await supabase.functions.invoke('fetch-employee-profile-documents', {
    body: payload,
  });
  

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to fetch employee profile documents');
  }

  const mergedRows = Array.isArray(data?.mergedDocuments) ? data.mergedDocuments : [];
  if (mergedRows.length > 0) {
    return mergedRows
      .filter((row: any) => row?.source === 'profile')
      .map((row: any, index: number) => ({
        id: `profile-${row.docKey || row.label || row.fileName || index}`,
        label: row.label || 'Document',
        fileName: row.fileName || 'Uploaded file',
        bucket: row.bucket || 'employee_profile_documents',
        storagePath: row.storagePath || undefined,
      }));
  }

  // Backward compatibility fallback if mergedDocuments is unavailable.
  return [];
}

export async function fetchEmployeeVerificationDocuments(employeeId: string): Promise<VerificationDocumentRow[]> {
  const { data, error } = await supabase.functions.invoke('fetch-employee-profile-documents', {
    body: { employeeId },
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to fetch employee verification documents');
  }

  return mapVerificationRows(Array.isArray(data.verificationDocuments) ? data.verificationDocuments : []);
}

export async function getProfileDocumentSignedUrl(bucket: string, storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function resolveVerificationDocumentUrl(documentUrl: string): Promise<string | null> {
  if (!documentUrl?.trim()) return null;
  const trimmed = documentUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;

  let path = trimmed.replace(/^\/+/, '');
  let bucket = 'employee-documents';

  if (path.startsWith('employee-documents/')) {
    path = path.slice('employee-documents/'.length);
  } else if (path.startsWith('employee_other_documents/')) {
    bucket = 'employee_other_documents';
    path = path.slice('employee_other_documents/'.length);
  } else if (path.startsWith('employee_other_type_statement/')) {
    bucket = 'employee_other_type_statement';
    path = path.slice('employee_other_type_statement/'.length);
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (!error && data?.signedUrl) return data.signedUrl;

  const fallback = formatSupabaseUrl(documentUrl);
  if (fallback.startsWith('http://') || fallback.startsWith('https://')) return fallback;
  return null;
}
