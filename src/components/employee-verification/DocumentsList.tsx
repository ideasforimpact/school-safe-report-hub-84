
import React from 'react';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import DocumentCard from './DocumentCard';
import { FileX, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import VerificationStatusBadge from './VerificationStatusBadge';
import { VerificationDocumentType } from '@/types/employeeVerification';

interface DocumentsListProps {
  employeeId: string;
}

// Helper function to get document type display name
const getDocumentTypeLabel = (type: VerificationDocumentType) => {
  switch (type) {
    case 'aadhar': return 'Aadhar Card';
    case 'pan': return 'PAN Card';
    case 'driving_license': return 'Driving License';
    case 'passport': return 'Passport';
    case 'voter_id': return 'Voter ID';
    case 'bank_account': return 'Bank Account';
    default: return type;
  }
};

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);

  // All possible document types
  const allDocumentTypes: VerificationDocumentType[] = [
    'aadhar', 'pan', 'driving_license', 'passport', 'voter_id', 'bank_account'
  ];

  // Create a map of document types to their verification status
  const documentStatusMap = new Map<VerificationDocumentType, {
    status: 'verified' | 'failed' | 'pending' | 'missing',
    document?: any
  }>();
  
  // Initialize all document types as missing
  allDocumentTypes.forEach(type => {
    documentStatusMap.set(type, { status: 'missing' });
  });
  
  // Update with actual document statuses
  documents.forEach(doc => {
    documentStatusMap.set(doc.documentType, {
      status: doc.verificationStatus,
      document: doc
    });
  });

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
    <div className="space-y-6 text-left">
      <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Verification Status Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from(documentStatusMap.entries()).map(([type, { status }]) => (
            <div 
              key={type} 
              className={`p-4 rounded-lg border flex items-center justify-between transition-all 
                ${status === 'verified' ? 'bg-green-50 border-green-200' : 
                status === 'failed' ? 'bg-red-50 border-red-200' : 
                status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
                'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center">
                {status === 'verified' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                {status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
                {status === 'pending' && <Clock className="h-5 w-5 text-yellow-600 mr-2" />}
                {status === 'missing' && <FileX className="h-5 w-5 text-gray-400 mr-2" />}
                <span className="font-medium">{getDocumentTypeLabel(type)}</span>
              </div>
              {status !== 'missing' ? (
                <VerificationStatusBadge status={status} />
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Not Uploaded</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">Document Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
};

export default DocumentsList;
