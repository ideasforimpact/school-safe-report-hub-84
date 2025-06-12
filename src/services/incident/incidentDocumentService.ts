
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
  // Upload files to storage and return document info
  async uploadFiles(incidentId: string, clientId: string, files: FileItem[]): Promise<IncidentDocument[]> {
    const uploadedDocuments: IncidentDocument[] = [];

    for (const file of files) {
      try {
        // Generate unique file path with hierarchical structure: incidents/{clientId}/{incidentId}/
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `incidents/${clientId}/${incidentId}/${timestamp}_${file.id}.${fileExtension}`;
        
        // Convert base64 to blob
        const base64Data = file.base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.type });

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('incident-documents')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('incident-documents')
          .getPublicUrl(fileName);

        const document: IncidentDocument = {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
          path: fileName,
          uploadedAt: new Date().toISOString()
        };

        uploadedDocuments.push(document);
        console.log('Successfully uploaded file:', file.name, 'to:', urlData.publicUrl);
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        throw error;
      }
    }

    return uploadedDocuments;
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
      url: doc.url || '',
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
