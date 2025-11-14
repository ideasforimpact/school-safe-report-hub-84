import { supabase } from '@/integrations/supabase/client';

export async function enqueueEmployeeDocumentUpload(payload: {
  clientId: string;
  employeeId: string;
  documentId: string;
  files: Array<{
    objectPath: string;
    fileName: string;
    contentType?: string;
    size?: number;
  }>;
}) {
  const { data, error } = await supabase.functions.invoke('enqueue-employee-document-upload', {
    body: payload,
  });
  if (error) throw error;
  return data as { success: boolean; message_id?: number };
}













