
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
 * Formats file size into human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};
