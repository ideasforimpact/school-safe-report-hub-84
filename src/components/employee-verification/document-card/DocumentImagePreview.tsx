
import React from 'react';
import { FileCheck, File } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface DocumentImagePreviewProps {
  documentImage: string;
}

const DocumentImagePreview: React.FC<DocumentImagePreviewProps> = ({ documentImage }) => {
  const isImageUrl = documentImage.startsWith('http') || documentImage.startsWith('data:image');
  
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 mb-4">
      <AspectRatio ratio={16 / 9}>
        {isImageUrl ? (
          <img 
            src={documentImage} 
            alt="Document preview" 
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
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
