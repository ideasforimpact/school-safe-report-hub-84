
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
  source?: 'incident' | 'closure' | 'comment';
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
      const uploadedDocuments: IncidentDocument[] = (data.documents || []).map((doc: Record<string, unknown>) => ({
        id: doc.id as string,
        name: doc.name as string,
        type: doc.type as string,
        size: doc.size as number,
        url: '', // Edge function only returns path, URL will be generated when needed
        path: doc.path as string,
        uploadedAt: doc.uploadedAt as string
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
      const uploadedDocuments: IncidentDocument[] = (data.documents || []).map((doc: Record<string, unknown>) => ({
        id: doc.id as string,
        name: doc.name as string,
        type: doc.type as string,
        size: doc.size as number,
        url: '', // Edge function only returns path, URL will be generated when needed
        path: doc.path as string,
        uploadedAt: doc.uploadedAt as string
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
      .update({ documents: documentsForStorage as unknown as import('@/integrations/supabase/types').Json })
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident documents:', error);
      throw error;
    }

    console.log('Successfully updated incident documents in database for incident:', incidentId);
  },

  // Convert the raw `incidents.documents` JSON column back to IncidentDocument[].
  // Pulled out so callers that already have the incident row loaded (e.g. the
  // detail page) can reuse this without an extra direct table fetch.
  mapStoredDocuments(storedDocuments: Array<Record<string, unknown>> | null | undefined): IncidentDocument[] {
    return (storedDocuments || []).map((doc): IncidentDocument => ({
      id: doc.id || '',
      name: doc.name || '',
      type: doc.type || '',
      size: doc.size || 0,
      url: doc.path ? this.getPublicUrl(doc.path) : (doc.url || ''), // Generate URL from path if available
      path: doc.path || '',
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      source: 'incident'
    }));
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

    return this.mapStoredDocuments(data?.documents as Array<Record<string, unknown>>);
  },

  /** Closure attachments: fetch via edge function (public URLs + metadata). */
  async fetchClosureDocuments(incidentId: string): Promise<IncidentDocument[]> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'get-closure-documents',
        {
          body: { incident_id: incidentId },
        }
      );

      if (error) {
        console.error('Error fetching closure documents:', error);
        return [];
      }

      if (data?.error) {
        console.error('get-closure-documents:', data.error);
        return [];
      }

      const docs = (data?.documents || []) as Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
        path: string;
        uploadedAt: string;
        source?: string;
      }>;

      return docs.map(
        (doc): IncidentDocument => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: typeof doc.size === 'number' ? doc.size : 0,
          url: doc.url || '',
          path: doc.path || '',
          uploadedAt:
            typeof doc.uploadedAt === 'string'
              ? doc.uploadedAt
              : new Date().toISOString(),
          source: 'closure',
        })
      );
    } catch (err) {
      console.error('Error fetching closure documents:', err);
      return [];
    }
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
