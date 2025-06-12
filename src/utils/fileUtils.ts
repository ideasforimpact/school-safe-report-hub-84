
import { FileItem } from '@/types/fileTypes';

/**
 * Returns the appropriate icon component based on file type
 */
export const getFileTypeIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  } else if (fileType.startsWith('application/pdf') || 
              fileType.startsWith('application/msword') ||
              fileType.includes('document')) {
    return 'file-text';
  } else {
    return 'file';
  }
};

/**
 * Formats file size into human readable format with proper null handling
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return 'Unknown size';
  
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

/**
 * Opens a document in a new tab for viewing
 */
export const viewDocument = (url: string, name: string) => {
  try {
    const link = window.document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  } catch (error) {
    console.error('Error opening document:', error);
  }
};
