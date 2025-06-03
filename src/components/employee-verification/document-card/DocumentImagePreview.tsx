
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
      window.open(formattedUrl, '_blank');
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
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = `document-${new Date().getTime()}`;
      link.target = '_blank';
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
    <div className="overflow-hidden rounded-md border border-gray-200 mb-4 hover:shadow-md transition-all duration-200 relative">
      <AspectRatio ratio={16 / 9}>
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          <FileCheck className="h-10 w-10 text-gray-400 mb-2" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-3">
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
