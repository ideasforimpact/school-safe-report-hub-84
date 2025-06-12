
import React, { useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { incidentDocumentService } from '@/services/incident/incidentDocumentService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';

interface IncidentDocumentUploaderProps {
  incidentId: string;
  onDocumentsUploaded?: (documentCount: number) => void;
}

const IncidentDocumentUploader: React.FC<IncidentDocumentUploaderProps> = ({
  incidentId,
  onDocumentsUploaded
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const handleFilesChange = (files: FileItem[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !user?.clientId) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    try {
      // Upload files using the new hierarchical structure
      const uploadedDocs = await incidentDocumentService.uploadFiles(
        incidentId,
        user.clientId,
        selectedFiles
      );

      // Get existing documents and combine
      const existingDocs = await incidentDocumentService.getIncidentDocuments(incidentId);
      const allDocuments = [...existingDocs, ...uploadedDocs];

      // Update incident with all documents
      await incidentDocumentService.updateIncidentDocuments(incidentId, allDocuments);

      setSelectedFiles([]);
      onDocumentsUploaded?.(uploadedDocs.length);
      toast.success(`${uploadedDocs.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        onFilesChange={handleFilesChange}
        selectedFiles={selectedFiles}
        isUploading={isUploading}
        maxFiles={10}
        acceptedTypes="image/*,application/pdf"
        label="Upload Supporting Documents"
      />
      
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
        </button>
      )}
    </div>
  );
};

export default IncidentDocumentUploader;
