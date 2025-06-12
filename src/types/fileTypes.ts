
export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  base64?: string; // Make this required to match incident types
  uploadedAt?: Date;
  status?: 'uploading' | 'uploaded' | 'error';
}

export interface UploadedDocument {
  name: string;
  type: string;
  uploadedAt: string;
  files: {
    name: string;
    path: string;
    url: string;
    uploadedAt: string;
  }[];
}

// Utility function to format Supabase URLs
export const formatSupabaseUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already a full URL, return as is
  if (url.startsWith('http')) return url;
  
  // If it's a data URL, return as is
  if (url.startsWith('data:')) return url;
  
  // If it's a Supabase storage path, format it properly
  if (url.includes('supabase')) return url;
  
  // Default fallback
  return url;
};

// Utility function to check if a file is a PDF
export const isPdfFile = (url: string, fileName?: string): boolean => {
  if (!url && !fileName) return false;
  
  const checkString = fileName || url;
  return checkString.toLowerCase().includes('.pdf') || 
         checkString.toLowerCase().includes('application/pdf') ||
         checkString.includes('data:application/pdf');
};

// Helper function to ensure FileItem compatibility with incident types
export const ensureFileItemCompatibility = (fileItem: Partial<FileItem>): FileItem => {
  return {
    id: fileItem.id || '',
    name: fileItem.name || '',
    size: fileItem.size || 0,
    type: fileItem.type || '',
    url: fileItem.url,
    base64: fileItem.base64 || '', // Ensure base64 is always present
    uploadedAt: fileItem.uploadedAt,
    status: fileItem.status || 'uploaded'
  };
};
