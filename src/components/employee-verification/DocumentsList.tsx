
import React from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import DocumentCard from './DocumentCard';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No documents uploaded yet.</p>
          {onAddDocument && (
            <Button onClick={onAddDocument}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
