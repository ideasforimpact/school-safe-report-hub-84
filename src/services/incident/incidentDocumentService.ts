
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
  source?: 'incident' | 'comment'; // Add source property
  commentId?: string; // Add commentId property for comment documents
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
          uploadedAt: new Date(),
          source: 'incident' as const // Mark as incident document
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
      // Since supporting_documents doesn't exist, we'll return empty array for now
      // This will be handled by the aggregator which gets documents from comments
      console.log('Getting incident documents for:', incidentId);
      return [];
    } catch (error) {
      console.error('Error in getIncidentDocuments:', error);
      return [];
    }
  },

  updateIncidentDocuments: async (incidentId: string, documents: IncidentDocument[]): Promise<void> => {
    try {
      // Since supporting_documents doesn't exist, we'll skip this for now
      // Documents are stored through the comment system
      console.log('Skipping updateIncidentDocuments as supporting_documents column does not exist');
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

      // Since supporting_documents doesn't exist, we only delete from storage
      console.log('Document deleted from storage:', documentPath);
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }
};
