
import React from 'react';
import DocumentTypeSelector from '../../DocumentTypeSelector';
import DocumentForm from '../DocumentForm';
import { FileItem } from '@/types/fileTypes';

interface DocumentsTabProps {
  employeeId: string;
  selectedTypeId: string | null;
  files: FileItem[];
  isSubmitting: boolean;
  onSelectedTypeChange: (typeId: string) => void;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  employeeId,
  selectedTypeId,
  files,
  isSubmitting,
  onSelectedTypeChange,
  onSubmit,
  onCancel,
  onFileUploaded
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">Select Document Type <span className="text-red-500">*</span></h4>
        <div className="w-full">
          <DocumentTypeSelector 
            selectedTypeId={selectedTypeId} 
            onChange={onSelectedTypeChange} 
          />
        </div>
        {!selectedTypeId && <p className="text-xs text-red-500 mt-2">Please select a document type</p>}
      </div>

      {selectedTypeId && (
        <DocumentForm
          employeeId={employeeId}
          selectedTypeId={selectedTypeId}
          files={files}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onFileUploaded={onFileUploaded}
        />
      )}
    </div>
  );
};

export default DocumentsTab;
