
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
  if (!url) {
    console.warn('formatSupabaseUrl: Empty URL provided');
    return '';
  }
  
  // Check if it's already a properly formed URL with https://
  if (url.startsWith('https://')) {
    console.log('formatSupabaseUrl: URL already formatted:', url);
    return url;
  }
  
  // Get the Supabase project reference
  const projectRef = 'ybvxkiubnnixntghojyy';
  
  // Handle data URLs (base64 encoded)
  if (url.startsWith('data:')) {
    console.log('formatSupabaseUrl: Data URL provided:', url.substring(0, 50) + '...');
    return url;
  }
  
  // Handle the case where URL is just a filename within employee-documents bucket
  if (!url.includes('/') && !url.includes('storage')) {
    const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
    console.log('formatSupabaseUrl: Formatted filename to URL:', formattedUrl);
    return formattedUrl;
  }
  
  // Handle the case where URL is a relative path in a bucket (e.g., employee-id/filename)
  if (!url.includes('employee-documents/') && !url.includes('vehicle-documents/') && !url.includes('storage')) {
    const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
    console.log('formatSupabaseUrl: Formatted relative path to URL:', formattedUrl);
    return formattedUrl;
  }
  
  // Handle the case where URL has the bucket name directly
  if ((url.includes('employee-documents/') || url.includes('vehicle-documents/')) && !url.includes('storage')) {
    // Remove any leading slashes
    const cleanPath = url.replace(/^\/+/, '');
    const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanPath}`;
    console.log('formatSupabaseUrl: Formatted bucket path to URL:', formattedUrl);
    return formattedUrl;
  }
  
  // Handle the case with the full storage path including "/storage/v1/object/public/"
  if (url.includes('/storage/v1/object/public/') || url.includes('storage/v1/object/public/')) {
    // Normalize the path by removing leading slashes and ensuring proper structure
    const cleanPath = url.replace(/^\/+/, '')
                         .replace(/^https?:\/\/.*?\/storage\//, 'storage/');
    
    if (cleanPath.startsWith('storage/v1/object/public/')) {
      const formattedUrl = `https://${projectRef}.supabase.co/${cleanPath}`;
      console.log('formatSupabaseUrl: Formatted storage path to URL:', formattedUrl);
      return formattedUrl;
    }
    
    const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanPath.replace('storage/v1/object/public/', '')}`;
    console.log('formatSupabaseUrl: Cleaned storage path to URL:', formattedUrl);
    return formattedUrl;
  }
  
  // Default case: Assume it's a direct path to a file in the employee-documents bucket
  const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${url}`;
  console.log('formatSupabaseUrl: Default formatting to URL:', formattedUrl);
  return formattedUrl;
};

// Function to determine if file is a PDF
export const isPdfFile = (url: string, fileName?: string): boolean => {
  const formattedUrl = formatSupabaseUrl(url);
  return formattedUrl.toLowerCase().endsWith('.pdf') || 
         formattedUrl.toLowerCase().includes('application/pdf') ||
         (fileName && fileName.toLowerCase().endsWith('.pdf'));
};
