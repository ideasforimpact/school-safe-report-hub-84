
import React from 'react';
import { FileCheck, Eye, Download } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DocumentImagePreviewProps {
  documentImage: string;
}

const DocumentImagePreview: React.FC<DocumentImagePreviewProps> = ({ documentImage }) => {
  const { toast } = useToast();
  
  const formatDocumentUrl = (url: string) => {
    // If it's already a data URL or full URL, return as is
    if (url.startsWith('data:') || url.startsWith('http')) {
      return url;
    }
    
    // If it's a storage path, construct the proper Supabase URL
    if (url.includes('/')) {
      // Extract the actual file path from the URL if it contains bucket info
      let filePath = url;
      
      // If the URL already contains bucket structure, extract just the file path
      if (url.includes('employee_other_type_statement/')) {
        filePath = url.split('employee_other_type_statement/')[1] || url;
        return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee_other_type_statement/${filePath}`;
      }
      
      if (url.includes('employee-documents/')) {
        filePath = url.split('employee-documents/')[1] || url;
        return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${filePath}`;
      }
      
      // Check document type based on path indicators
      if (url.includes('bank_statement') || url.includes('court_case') || url.includes('police_verification') || url.includes('other_type')) {
        return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee_other_type_statement/${filePath}`;
      }
      
      // Default to employee-documents bucket for other documents
      return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${filePath}`;
    }
    
    // For simple filenames without path, default to employee-documents
    return `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${url}`;
  };
  
  const handleViewDocument = () => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatDocumentUrl(documentImage);
      console.log('Opening document URL for viewing:', formattedUrl);
      console.log('Original document image path:', documentImage);
      
      // Check if it's a PDF or image
      const isPdf = documentImage.toLowerCase().includes('.pdf') || documentImage.includes('pdf');
      
      if (isPdf) {
        // For PDFs, create an iframe or open in new tab
        if (documentImage.startsWith('data:')) {
          // For base64 PDFs, open in new tab directly
          window.open(documentImage, '_blank', 'noopener,noreferrer');
        } else {
          // For stored PDFs, open with PDF viewer
          const pdfViewerUrl = `${formattedUrl}#toolbar=1&navpanes=1&scrollbar=1`;
          window.open(pdfViewerUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        // For images, open directly
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = () => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatDocumentUrl(documentImage);
      let fileName = `document-${Date.now()}`;
      
      // If it's a data URL, use it directly
      if (documentImage.startsWith('data:')) {
        const mimeType = documentImage.split(':')[1].split(';')[0];
        fileName = `document-${Date.now()}.${mimeType.includes('pdf') ? 'pdf' : 'jpg'}`;
      } else {
        // Extract filename from URL if possible
        const urlParts = documentImage.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          fileName = lastPart;
        } else {
          // Add appropriate extension based on document type
          const extension = documentImage.toLowerCase().includes('pdf') ? 'pdf' : 'jpg';
          fileName = `${fileName}.${extension}`;
        }
      }
      
      console.log('Downloading document URL:', formattedUrl);
      console.log('Download filename:', fileName);
      
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Document download has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!documentImage) {
    return (
      <div className="overflow-hidden rounded-md border border-gray-200 mb-4">
        <AspectRatio ratio={16 / 9}>
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <FileCheck className="h-16 w-16 text-gray-300" />
          </div>
        </AspectRatio>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 mb-4 hover:shadow-md transition-all duration-200 relative group">
      <AspectRatio ratio={16 / 9}>
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          <FileCheck className="h-10 w-10 text-gray-400 mb-2" />
        </div>
        {/* Overlay with action buttons - visible on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white hover:bg-gray-100 shadow-sm"
            onClick={handleViewDocument}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white hover:bg-gray-100 shadow-sm"
            onClick={handleDownloadDocument}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </AspectRatio>
    </div>
  );
};

export default DocumentImagePreview;
