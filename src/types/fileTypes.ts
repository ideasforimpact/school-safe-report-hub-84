
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
  
  // Clean the URL path by removing any leading slashes or protocol remnants
  let cleanUrl = url.replace(/^\/+/, '').replace(/^https?:\/\/[^\/]+\//, '');
  
  // If URL already contains the full storage path, construct the complete URL
  if (cleanUrl.includes('storage/v1/object/public/')) {
    const formattedUrl = `https://${projectRef}.supabase.co/${cleanUrl}`;
    console.log('formatSupabaseUrl: Full storage path detected:', formattedUrl);
    return formattedUrl;
  }
  
  // If URL contains bucket path but not full storage path
  if (cleanUrl.includes('employee-documents/') || cleanUrl.includes('vehicle-documents/')) {
    const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${cleanUrl}`;
    console.log('formatSupabaseUrl: Bucket path detected:', formattedUrl);
    return formattedUrl;
  }
  
  // Default case: assume it's a filename in employee-documents bucket
  const formattedUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/employee-documents/${cleanUrl}`;
  console.log('formatSupabaseUrl: Default employee-documents formatting:', formattedUrl);
  return formattedUrl;
};

// Function to determine if file is a PDF
export const isPdfFile = (url: string, fileName?: string): boolean => {
  const formattedUrl = formatSupabaseUrl(url);
  return formattedUrl.toLowerCase().endsWith('.pdf') || 
         formattedUrl.toLowerCase().includes('application/pdf') ||
         (fileName && fileName.toLowerCase().endsWith('.pdf'));
};
