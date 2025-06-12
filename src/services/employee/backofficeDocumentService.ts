
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
      console.log('Starting completeDocument for:', { documentId, clientId, employeeId });
      
      // First verify the document exists and belongs to the specified employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select('id, employee_id')
        .eq('id', documentId)
        .eq('employee_id', employeeId)
        .single();

      if (documentError || !document) {
        console.error('Document verification failed:', documentError);
        throw new Error('Document not found or access denied');
      }

      // Then verify the employee belongs to the specified client
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (employeeError || !employee) {
        console.error('Employee verification failed:', employeeError);
        throw new Error('Employee does not belong to the specified client');
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

      console.log('Updating document to complete status:', completeStatus.id);

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
        console.error('Update failed:', updateError);
        throw new Error(`Failed to complete document: ${updateError.message}`);
      }

      console.log('Document completed successfully:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('Error completing document:', error);
      throw error;
    }
  },

  // Re-upload a document by updating the document URL
  async reUploadDocument({ documentId, clientId, employeeId, newDocumentUrl }: ReUploadDocumentRequest) {
    try {
      console.log('Starting reUploadDocument for:', { documentId, clientId, employeeId, newDocumentUrl });
      
      // First verify the document exists and belongs to the specified employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select('id, employee_id')
        .eq('id', documentId)
        .eq('employee_id', employeeId)
        .single();

      if (documentError || !document) {
        console.error('Document verification failed:', documentError);
        throw new Error('Document not found or access denied');
      }

      // Then verify the employee belongs to the specified client
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (employeeError || !employee) {
        console.error('Employee verification failed:', employeeError);
        throw new Error('Employee does not belong to the specified client');
      }

      console.log('Updating document URL to:', newDocumentUrl);

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
        console.error('Re-upload update failed:', updateError);
        throw new Error(`Failed to re-upload document: ${updateError.message}`);
      }

      console.log('Document re-uploaded successfully:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('Error re-uploading document:', error);
      throw error;
    }
  },

  // Upload file to employee_other_type_statement bucket
  async uploadToStorage(file: File, clientId: string, employeeId: string): Promise<string> {
    try {
      console.log('Starting file upload to storage:', { fileName: file.name, clientId, employeeId });
      
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${clientId}/${employeeId}/${timestamp}.${fileExtension}`;

      console.log('Uploading to storage path:', fileName);

      const { data, error } = await supabase.storage
        .from('employee_other_type_statement')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage upload failed:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      console.log('File uploaded successfully to storage:', data.path);
      return data.path;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  }
};
