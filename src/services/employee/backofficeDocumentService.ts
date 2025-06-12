
import { supabase } from '@/integrations/supabase/client';

export interface CompleteDocumentRequest {
  documentId: string;
  clientId: string;
  employeeId: string;
}

export interface ReUploadDocumentRequest {
  documentId: string;
  clientId: string;
  employeeId: string;
  newDocumentUrl: string;
}

export const backofficeDocumentService = {
  // Complete a document by updating status to verified and document_status_id to complete
  async completeDocument({ documentId, clientId, employeeId }: CompleteDocumentRequest) {
    try {
      // First verify the document belongs to the specified client and employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select(`
          id,
          employee_id,
          employees!inner(client_id)
        `)
        .eq('id', documentId)
        .eq('employee_id', employeeId)
        .single();

      if (documentError || !document) {
        throw new Error('Document not found or access denied');
      }

      // Verify client ID matches
      if (document.employees.client_id !== clientId) {
        throw new Error('Document does not belong to the specified client');
      }

      // Get the complete status ID
      const { data: completeStatus, error: statusError } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', 'complete')
        .single();

      if (statusError || !completeStatus) {
        throw new Error('Complete status not found');
      }

      // Update the document
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'verified',
          document_status_id: completeStatus.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to complete document: ${updateError.message}`);
      }

      return updatedDocument;
    } catch (error) {
      console.error('Error completing document:', error);
      throw error;
    }
  },

  // Re-upload a document by updating the document URL
  async reUploadDocument({ documentId, clientId, employeeId, newDocumentUrl }: ReUploadDocumentRequest) {
    try {
      // First verify the document belongs to the specified client and employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select(`
          id,
          employee_id,
          employees!inner(client_id)
        `)
        .eq('id', documentId)
        .eq('employee_id', employeeId)
        .single();

      if (documentError || !document) {
        throw new Error('Document not found or access denied');
      }

      // Verify client ID matches
      if (document.employees.client_id !== clientId) {
        throw new Error('Document does not belong to the specified client');
      }

      // Update the document URL and reset status to pending
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          document_url: newDocumentUrl,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to re-upload document: ${updateError.message}`);
      }

      return updatedDocument;
    } catch (error) {
      console.error('Error re-uploading document:', error);
      throw error;
    }
  },

  // Upload file to employee_other_type_statement bucket
  async uploadToStorage(file: File, clientId: string, employeeId: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${clientId}/${employeeId}/${timestamp}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from('employee_other_type_statement')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  }
};
