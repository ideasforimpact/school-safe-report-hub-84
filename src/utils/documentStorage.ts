
import { supabase } from '@/integrations/supabase/client';

export interface DocumentStorageItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
}

export const documentStorage = {
  // Convert base64 to blob for download
  base64ToBlob: (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  },

  // Download document
  downloadDocument: (document: DocumentStorageItem) => {
    try {
      if (document.base64) {
        // Handle base64 documents
        const blob = documentStorage.base64ToBlob(document.base64, document.type);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = document.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (document.url) {
        // Handle URL-based documents
        const link = document.createElement('a');
        link.href = document.url;
        link.download = document.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  },

  // Get document preview URL
  getPreviewUrl: (document: DocumentStorageItem): string => {
    if (document.base64) {
      return document.base64;
    }
    return document.url || '';
  },

  // Check if document can be previewed
  canPreview: (document: DocumentStorageItem): boolean => {
    const type = document.type?.toLowerCase() || '';
    return type.startsWith('image/') || type === 'application/pdf';
  }
};
