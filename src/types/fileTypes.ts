
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
  
  // Handle data URLs (base64 encoded) - convert to blob URL for viewing
  if (url.startsWith('data:')) {
    console.log('formatSupabaseUrl: Converting data URL to blob for viewing');
    try {
      // Extract base64 content
      const base64Data = url.split(',')[1];
      const mimeType = url.split(':')[1].split(';')[0];
      
      // Convert to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob and return blob URL
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting data URL to blob:', error);
      return url; // fallback to original
    }
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
  // Handle data URLs
  if (url.startsWith('data:')) {
    return url.includes('application/pdf') || url.includes('pdf');
  }
  
  const formattedUrl = formatSupabaseUrl(url);
  return formattedUrl.toLowerCase().endsWith('.pdf') || 
         formattedUrl.toLowerCase().includes('application/pdf') ||
         (fileName && fileName.toLowerCase().endsWith('.pdf'));
};
