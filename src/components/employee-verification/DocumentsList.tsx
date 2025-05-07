
import React from 'react';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import DocumentCard from './DocumentCard';

interface DocumentsListProps {
  employeeId: string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);

  if (documents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700">No Documents</h3>
        <p className="text-gray-500 mt-2">
          No verification documents have been added for this employee yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
};

export default DocumentsList;
