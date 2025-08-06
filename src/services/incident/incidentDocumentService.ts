import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/fileTypes';
import { sanitizeFilename, generateUniqueFilename } from '@/utils/filenameSanitizer';

export interface IncidentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: Date;
}

export const incidentDocumentService = {
  // Upload files with hierarchical client/incident structure
  uploadFiles: async (incidentId: string, clientId: string, files: FileItem[]): Promise<IncidentDocument[]> => {
    console.log('Uploading files for incident:', incidentId, 'client:', clientId, 'files:', files.length);

    const uploadPromises = files.map(async (file) => {
      try {
        // Convert base64 to blob
        const base64Data = file.base64.split(',')[1] || file.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.type });

        // Create hierarchical path: client/incident/sanitized_filename
        const sanitizedFilename = generateUniqueFilename(file.name);
        const filePath = `${clientId}/${incidentId}/${sanitizedFilename}`;

        console.log('Uploading file to path:', filePath);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('incident-documents')
          .upload(filePath, blob, {
            contentType: file.type,
            upsert: false
          });

        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('incident-documents')
          .getPublicUrl(filePath);

        return {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
          path: filePath,
          uploadedAt: new Date()
        };
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  },

  getIncidentDocuments: async (incidentId: string): Promise<IncidentDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('supporting_documents')
        .eq('id', incidentId)
        .single();

      if (error) {
        console.error('Error fetching incident documents:', error);
        return [];
      }

      return data?.supporting_documents || [];
    } catch (error) {
      console.error('Error in getIncidentDocuments:', error);
      return [];
    }
  },

  updateIncidentDocuments: async (incidentId: string, documents: IncidentDocument[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ supporting_documents: documents })
        .eq('id', incidentId);

      if (error) {
        console.error('Error updating incident documents:', error);
        throw new Error(`Failed to update incident documents: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateIncidentDocuments:', error);
      throw error;
    }
  },

  deleteDocument: async (incidentId: string, documentPath: string): Promise<void> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('incident-documents')
        .remove([documentPath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        throw new Error(`Failed to delete file from storage: ${storageError.message}`);
      }

      // Remove from incident's supporting_documents array
      const existingDocs = await incidentDocumentService.getIncidentDocuments(incidentId);
      const updatedDocs = existingDocs.filter(doc => doc.path !== documentPath);
      await incidentDocumentService.updateIncidentDocuments(incidentId, updatedDocs);
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }
};
