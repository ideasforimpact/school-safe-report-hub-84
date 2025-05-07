
import React from 'react';
import { FileCheck, Eye, Download } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentImagePreviewProps {
  documentImage: string;
}

const DocumentImagePreview: React.FC<DocumentImagePreviewProps> = ({ documentImage }) => {
  const isImageUrl = documentImage.startsWith('http') || documentImage.startsWith('data:image');
  
  const handleViewDocument = () => {
    window.open(documentImage, '_blank');
  };

  const handleDownloadDocument = () => {
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = documentImage;
    link.download = `document-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 mb-4 hover:shadow-md transition-all duration-200 relative">
      <AspectRatio ratio={16 / 9}>
        {isImageUrl ? (
          <>
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
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <FileCheck className="h-16 w-16 text-gray-300" />
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export default DocumentImagePreview;
