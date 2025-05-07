
import React from 'react';
import { FileCheck } from 'lucide-react';

interface DocumentImagePreviewProps {
  documentImage: string;
}

const DocumentImagePreview: React.FC<DocumentImagePreviewProps> = ({ documentImage }) => {
  return (
    <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
      {/* This would be an actual document image in a real app */}
      <FileCheck className="h-12 w-12 text-gray-400" />
    </div>
  );
};

export default DocumentImagePreview;
