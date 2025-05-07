
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
            <img 
              src={documentImage} 
              alt="Document preview" 
              className={cn(
                "h-full w-full object-cover transition-all",
                "filter blur-[2px] hover:blur-0"
              )}
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/90 hover:bg-white"
                onClick={handleViewDocument}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                View
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/90 hover:bg-white"
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
