
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentStatusButton from '@/components/employee-verification/document-card/DocumentStatusButton';
import DocumentDeleteButton from '@/components/employee-verification/document-card/DocumentDeleteButton';
import { FileText } from 'lucide-react';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onView: (document: VerificationDocument) => void;
  onVerifyAadhar?: (document: VerificationDocument) => void;
  onVerifyPan?: (document: VerificationDocument) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ 
  documents, 
  onView, 
  onVerifyAadhar, 
  onVerifyPan 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Document
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Number
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Uploaded
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Verified
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className="border-b transition-colors hover:bg-gray-50"
            >
              <td className="p-4 align-middle font-medium">
                <div className="flex gap-2 items-center">
                  <FileText className="h-4 w-4 opacity-70" />
                  <span>{doc.documentTypeName?.toUpperCase() || 'Document'}</span>
                </div>
              </td>
              <td className="p-4 align-middle">
                {doc.documentNumber || <span className="text-gray-400">Not provided</span>}
              </td>
              <td className="p-4 align-middle">
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
              </td>
              <td className="p-4 align-middle">
                {doc.verificationStatus === 'verified' && doc.verificationDate && (
                  <span>
                    {formatDistanceToNow(new Date(doc.verificationDate), { addSuffix: true })}
                  </span>
                )}
                {doc.verificationStatus === 'pending' && (
                  <span className="text-gray-400">Not verified</span>
                )}
              </td>
              <td className="p-4 align-middle">
                <DocumentStatusButton status={doc.verificationStatus} />
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(doc)}
                    className="h-8"
                  >
                    View
                  </Button>
                  {/* Show verification buttons for pending documents */}
                  {doc.verificationStatus === 'pending' && doc.documentTypeName === 'aadhar' && onVerifyAadhar && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => onVerifyAadhar(doc)}
                    >
                      Verify
                    </Button>
                  )}
                  {doc.verificationStatus === 'pending' && doc.documentTypeName === 'pan' && onVerifyPan && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => onVerifyPan(doc)}
                    >
                      Verify
                    </Button>
                  )}
                  <DocumentDeleteButton documentId={doc.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsTable;
