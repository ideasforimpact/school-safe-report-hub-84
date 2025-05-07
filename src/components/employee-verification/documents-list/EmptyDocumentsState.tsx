
import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyDocumentsStateProps {
  onAddDocument?: () => void;
}

const EmptyDocumentsState: React.FC<EmptyDocumentsStateProps> = ({ onAddDocument }) => {
  return (
    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <div className="max-w-md mx-auto">
        <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No documents yet</h3>
        <p className="text-gray-500 mb-6">Upload identification documents to verify this employee</p>
        {onAddDocument && (
          <Button onClick={onAddDocument} className="shadow-sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyDocumentsState;
