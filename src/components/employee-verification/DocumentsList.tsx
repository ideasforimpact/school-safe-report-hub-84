
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
    <div className="space-y-6">
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
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
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Documents ({documents.length})
            </h3>
            {onAddDocument && (
              <Button onClick={onAddDocument} size="sm" className="shadow-sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentsList;
