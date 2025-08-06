
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/incident';

export interface StoredFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
}

export const commentFileStorage = {
  // Upload a file to storage and return the URL
  uploadFile: async (file: FileItem, incidentId: string): Promise<StoredFileItem> => {
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

      // Create a unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}_${randomId}`;
      const filePath = `${incidentId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('incident-comment-docs')
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('incident-comment-docs')
        .getPublicUrl(filePath);

      return {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files: FileItem[], incidentId: string): Promise<StoredFileItem[]> => {
    const uploadPromises = files.map(file => commentFileStorage.uploadFile(file, incidentId));
    return Promise.all(uploadPromises);
  },

  // Delete a file from storage
  deleteFile: async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('incident-comment-docs')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  },

  // Get download URL for a file
  getDownloadUrl: (filePath: string): string => {
    const { data } = supabase.storage
      .from('incident-comment-docs')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Check if file can be previewed
  canPreview: (fileType: string): boolean => {
    const type = fileType?.toLowerCase() || '';
    return type.startsWith('image/') || type === 'application/pdf';
  },

  // Format file size
  formatFileSize: (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
};
