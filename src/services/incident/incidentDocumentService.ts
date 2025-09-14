
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/fileTypes';

export interface IncidentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: string;
  source?: 'incident' | 'comment';
  commentId?: string;
}

// Type for storing in database (JSON compatible)
interface IncidentDocumentRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: string;
}

export const incidentDocumentService = {
  // Helper function to generate public URL from path
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('incident-documents')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Upload files using edge function and return document info
  async uploadFiles(incidentId: string, clientId: string, files: FileItem[]): Promise<IncidentDocument[]> {
    try {
      console.log('Uploading files via edge function:', {
        incidentId,
        clientId,
        filesCount: files.length
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('upload-incident-documents', {
        body: {
          incidentId,
          clientId,
          files
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to upload files: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Unknown error occurred during file upload');
      }

      console.log('Successfully uploaded files via edge function:', data.documents?.length || 0);

      // Convert edge function response to IncidentDocument format
      const uploadedDocuments: IncidentDocument[] = (data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: '', // Edge function only returns path, URL will be generated when needed
        path: doc.path,
        uploadedAt: doc.uploadedAt
      }));

      return uploadedDocuments;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Upload files and update incident in one operation using edge function
  async uploadFilesAndUpdateIncident(incidentId: string, clientId: string, files: FileItem[]): Promise<IncidentDocument[]> {
    try {
      console.log('Uploading files and updating incident via edge function:', {
        incidentId,
        clientId,
        filesCount: files.length
      });

      // Call the edge function which handles both upload and incident update
      const { data, error } = await supabase.functions.invoke('upload-incident-documents', {
        body: {
          incidentId,
          clientId,
          files
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to upload files and update incident: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Unknown error occurred during file upload and incident update');
      }

      console.log('Successfully uploaded files and updated incident via edge function:', data.documents?.length || 0);

      // Convert edge function response to IncidentDocument format
      const uploadedDocuments: IncidentDocument[] = (data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: '', // Edge function only returns path, URL will be generated when needed
        path: doc.path,
        uploadedAt: doc.uploadedAt
      }));

      return uploadedDocuments;
    } catch (error) {
      console.error('Error uploading files and updating incident:', error);
      throw error;
    }
  },

  // Update incident with documents
  async updateIncidentDocuments(incidentId: string, documents: IncidentDocument[]): Promise<void> {
    // Convert to plain objects for JSON storage
    const documentsForStorage: IncidentDocumentRecord[] = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      url: doc.url,
      path: doc.path,
      uploadedAt: doc.uploadedAt
    }));

    const { error } = await supabase
      .from('incidents')
      .update({ documents: documentsForStorage as any })
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident documents:', error);
      throw error;
    }

    console.log('Successfully updated incident documents in database for incident:', incidentId);
  },

  // Get incident documents
  async getIncidentDocuments(incidentId: string): Promise<IncidentDocument[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('documents')
      .eq('id', incidentId)
      .single();

    if (error) {
      console.error('Error fetching incident documents:', error);
      throw error;
    }

    // Convert from stored format back to IncidentDocument[]
    const storedDocuments = data?.documents as any[];
    return (storedDocuments || []).map((doc: any): IncidentDocument => ({
      id: doc.id || '',
      name: doc.name || '',
      type: doc.type || '',
      size: doc.size || 0,
      url: doc.path ? this.getPublicUrl(doc.path) : (doc.url || ''), // Generate URL from path if available
      path: doc.path || '',
      uploadedAt: doc.uploadedAt || new Date().toISOString()
    }));
  },

  // Delete document from storage and update incident
  async deleteDocument(incidentId: string, documentPath: string): Promise<void> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('incident-documents')
        .remove([documentPath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        throw storageError;
      }

      // Get current documents
      const currentDocuments = await this.getIncidentDocuments(incidentId);
      
      // Remove the deleted document
      const updatedDocuments = currentDocuments.filter(doc => doc.path !== documentPath);
      
      // Update incident
      await this.updateIncidentDocuments(incidentId, updatedDocuments);
      
      console.log('Successfully deleted document:', documentPath);
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }
};
