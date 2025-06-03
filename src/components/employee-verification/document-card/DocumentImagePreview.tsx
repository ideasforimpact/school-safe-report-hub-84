
import React from 'react';
import { FileCheck, Eye, Download } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatSupabaseUrl } from '@/types/fileTypes';

interface DocumentImagePreviewProps {
  documentImage: string;
}

const DocumentImagePreview: React.FC<DocumentImagePreviewProps> = ({ documentImage }) => {
  const { toast } = useToast();
  
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
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Opening document URL:', formattedUrl);
      
      // Add a timestamp to bypass cache issues
      const urlWithTimestamp = `${formattedUrl}?t=${Date.now()}`;
      window.open(urlWithTimestamp, '_blank');
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
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Downloading document URL:', formattedUrl);
      
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = `document-${Date.now()}`;
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
