
export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  base64: string; // Made required to match incident types
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

/**
 * Turn stored `document_url` values into a browser-openable URL when they are
 * storage paths (same rules as employee verification / backoffice mapping).
 */
export const formatSupabaseUrl = (url: string): string => {
  if (!url) return '';

  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;

  const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL as string | undefined;

  if (!base || typeof base !== 'string') return trimmed;

  const normalizedBase = base.replace(/\/$/, '');
  let path = trimmed.replace(/^\/+/, '');

  if (path.includes('employee_other_documents/')) {
    const after = path.split('employee_other_documents/')[1] || path;
    return `${normalizedBase}/employee_other_documents/${after}`;
  }
  if (path.includes('employee_other_type_statement/')) {
    const after = path.split('employee_other_type_statement/')[1] || path;
    return `${normalizedBase}/employee_other_type_statement/${after}`;
  }
  if (path.includes('employee-documents/')) {
    const after = path.split('employee-documents/')[1] || path;
    return `${normalizedBase}/employee-documents/${after}`;
  }

  return `${normalizedBase}/employee-documents/${path}`;
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
