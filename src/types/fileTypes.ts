
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

// Updated utility functions for Supabase URLs with improved URL handling
export const formatSupabaseUrl = (url: string): string => {
  if (!url) return '';
  
  // Check if it's already a properly formed URL with https://
  if (url.startsWith('https://')) return url;
  
  // Get the Supabase project reference
  const projectRef = 'ybvxkiubnnixntghojyy';
  
  // Handle the case where URL is just a path within employee-documents bucket
  if (!url.includes('/')) {
    return `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
  }
  
  // Handle the case where URL is a relative path in a bucket (e.g., employee-id/filename)
  if (!url.includes('employee-documents/') && !url.includes('vehicle-documents/')) {
    return `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
  }
  
  // Handle the case where URL has the bucket name directly
  if (url.includes('employee-documents/') || url.includes('vehicle-documents/')) {
    // Remove any leading slashes
    const cleanPath = url.replace(/^\/+/, '');
    return `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanPath}`;
  }
  
  // Handle the case with the full storage path including "/storage/v1/object/public/"
  if (url.includes('/storage/v1/object/public/') || url.includes('storage/v1/object/public/')) {
    // Normalize the path by removing leading slashes and ensuring proper structure
    const cleanPath = url.replace(/^\/+/, '')
                         .replace(/^https?:\/\/.*?\/storage\//, 'storage/');
    
    if (cleanPath.startsWith('storage/v1/object/public/')) {
      return `https://${projectRef}.supabase.co/${cleanPath}`;
    }
    
    return `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanPath.replace('storage/v1/object/public/', '')}`;
  }
  
  // Default case: Assume it's a direct path to a file in the employee-documents bucket
  return `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
};

// Function to determine if file is a PDF
export const isPdfFile = (url: string, fileName?: string): boolean => {
  const formattedUrl = formatSupabaseUrl(url);
  return formattedUrl.toLowerCase().endsWith('.pdf') || 
         formattedUrl.toLowerCase().includes('application/pdf') ||
         (fileName && fileName.toLowerCase().endsWith('.pdf'));
};
