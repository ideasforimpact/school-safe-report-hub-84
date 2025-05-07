
import React from 'react';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import DocumentCard from './DocumentCard';
import { FileX } from 'lucide-react';

interface DocumentsListProps {
  employeeId: string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);

  if (documents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8 text-left">
        <div className="flex flex-col items-center md:items-start md:flex-row gap-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <FileX className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Documents Found</h3>
            <p className="text-gray-500">
              No verification documents have been added for this employee yet. 
              Click the "Add Document" button to upload the first document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
};

export default DocumentsList;
