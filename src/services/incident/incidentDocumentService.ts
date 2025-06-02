
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

export const incidentDocumentService = {
  // Upload files to storage and return document info
  async uploadFiles(incidentId: string, files: FileItem[]): Promise<IncidentDocument[]> {
    const uploadedDocuments: IncidentDocument[] = [];

    for (const file of files) {
      try {
        // Generate unique file path
        const timestamp = Date.now();
        const fileName = `${incidentId}/${timestamp}_${file.name}`;
        
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
            upsert: false
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
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        throw error;
      }
    }

    return uploadedDocuments;
  },

  // Update incident with documents
  async updateIncidentDocuments(incidentId: string, documents: IncidentDocument[]): Promise<void> {
    const { error } = await supabase
      .from('incidents')
      .update({ documents: documents })
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident documents:', error);
      throw error;
    }
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

    return (data?.documents as IncidentDocument[]) || [];
  },

  // Delete document from storage and update incident
  async deleteDocument(incidentId: string, documentPath: string): Promise<void> {
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
  }
};
