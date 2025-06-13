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

export interface VerifyDocumentRequest {
  documentId: string;
  clientId: string;
  employeeId: string;
  action: 'completed' | 'rejected';
  comments: string;
  attachments: string[];
}

export interface UpdateVerificationHistoryRequest {
  documentId: string;
  clientId: string;
  employeeId: string;
  verificationHistory: any[];
}

export const backofficeDocumentService = {
  // Complete a document by updating status to completed and document_status_id to completed
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

      // Get the completed status ID
      const { data: completedStatus, error: statusError } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', 'completed')
        .single();

      if (statusError || !completedStatus) {
        throw new Error('Completed status not found');
      }

      console.log('Updating document to completed status:', completedStatus.id);

      // Update the document - set both verification_status and document_status_id to completed
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'completed',
          document_status_id: completedStatus.id,
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

  // Re-upload a document by updating the document URL only, keeping the existing status
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

      // Update only the document URL and timestamp, keep existing verification status
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          document_url: newDocumentUrl,
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

  // Verify document with complete or reject action
  async verifyDocument({ documentId, clientId, employeeId, action, comments, attachments }: VerifyDocumentRequest) {
    try {
      console.log('Starting verifyDocument for:', { documentId, clientId, employeeId, action });
      
      // First verify the document exists and belongs to the specified employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select('id, employee_id, params')
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

      // Get the status ID based on action
      const statusName = action === 'completed' ? 'completed' : 'rejected';
      const { data: statusRecord, error: statusError } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', statusName)
        .single();

      if (statusError || !statusRecord) {
        throw new Error(`${statusName} status not found`);
      }

      // Prepare verification history entry
      const verificationEntry = {
        action,
        comments,
        attachments,
        timestamp: new Date().toISOString(),
        verified_by: 'backoffice_user' // TODO: Replace with actual backoffice user ID when available
      };

      // Get existing params or initialize - properly type cast the params
      const existingParams = (document.params as Record<string, any>) || {};
      const verificationHistory = existingParams.verification_history || [];
      
      // Add new entry to verification history
      const updatedParams = {
        ...existingParams,
        verification_history: [...verificationHistory, verificationEntry]
      };

      console.log('Updating document with verification action:', action);

      // Update the document
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: action,
          document_status_id: statusRecord.id,
          params: updatedParams,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        console.error('Verification update failed:', updateError);
        throw new Error(`Failed to verify document: ${updateError.message}`);
      }

      console.log('Document verified successfully:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  },

  // New method to update verification history
  async updateVerificationHistory({ documentId, clientId, employeeId, verificationHistory }: UpdateVerificationHistoryRequest) {
    try {
      console.log('Starting updateVerificationHistory for:', { documentId, clientId, employeeId });
      
      // First verify the document exists and belongs to the specified employee
      const { data: document, error: documentError } = await supabase
        .from('employee_documents')
        .select('id, employee_id, params')
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

      // Get existing params or initialize
      const existingParams = (document.params as Record<string, any>) || {};
      
      // Update params with new verification history
      const updatedParams = {
        ...existingParams,
        verification_history: verificationHistory
      };

      console.log('Updating document with new verification history');

      // Update the document params with the new verification history
      const { data: updatedDocument, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          params: updatedParams,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        console.error('Verification history update failed:', updateError);
        throw new Error(`Failed to update verification history: ${updateError.message}`);
      }

      console.log('Verification history updated successfully:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('Error updating verification history:', error);
      throw error;
    }
  },

  // Upload file to employee_other_type_statement bucket and return full public URL
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
      
      // Construct the full public URL
      const publicUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee_other_type_statement/${data.path}`;
      console.log('Generated public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  }
};
