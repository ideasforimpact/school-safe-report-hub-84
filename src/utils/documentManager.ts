
export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  base64?: string;
}

export const documentManager = {
  // Convert base64 to blob for downloads
  base64ToBlob: (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  },

  // Download document with loading state
  downloadDocument: async (document: DocumentItem): Promise<void> => {
    try {
      if (document.base64) {
        // Handle base64 documents
        const blob = documentManager.base64ToBlob(document.base64, document.type);
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (document.url) {
        // Handle URL-based documents
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = document.name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  },

  // Get document preview URL
  getPreviewUrl: (document: DocumentItem): string => {
    if (document.base64) {
      return document.base64;
    }
    return document.url || '';
  },

  // Check if document can be previewed
  canPreview: (document: DocumentItem): boolean => {
    const type = document.type?.toLowerCase() || '';
    return type.startsWith('image/') || type === 'application/pdf';
  },

  // Format file size
  formatFileSize: (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
};
