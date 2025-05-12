
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

// Add the UploadedDocument interface
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

// Add utility functions for Supabase URLs
export const formatSupabaseUrl = (url: string): string => {
  if (!url) return '';
  
  // Check if it's already a properly formed URL with https://
  if (url.startsWith('https://')) return url;
  
  // If URL starts with /storage or storage, adjust it to use the public URL format
  if (url.includes('/storage/v1/object/public/') || url.includes('storage/v1/object/public/')) {
    // Extract the project reference from the current window location if in browser
    const projectRef = typeof window !== 'undefined' 
      ? window.location.hostname.split('.')[0] 
      : 'ybvxkiubnnixntghojyy';
      
    // Format the URL correctly
    const cleanUrl = url.replace(/^\/+/, '').replace(/^https?:\/\/.*?\/storage\//, 'storage/');
    
    if (cleanUrl.startsWith('storage/v1/object/public/')) {
      return `https://${projectRef}.supabase.co/${cleanUrl}`;
    }
    
    return `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanUrl.replace('storage/v1/object/public/', '')}`;
  }
  
  // If it's a path to a bucket/file without the full URL structure
  if (url.startsWith('vehicle-documents/')) {
    return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/${url}`;
  }
  
  return url;
};

// Function to determine if file is a PDF
export const isPdfFile = (url: string, fileName?: string): boolean => {
  const formattedUrl = formatSupabaseUrl(url);
  return formattedUrl.toLowerCase().endsWith('.pdf') || 
         formattedUrl.toLowerCase().includes('application/pdf') ||
         (fileName && fileName.toLowerCase().endsWith('.pdf'));
};
