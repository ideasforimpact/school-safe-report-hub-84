
import React, { useState, useEffect } from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DocumentCard from '@/components/employee-verification/DocumentCard';
import EmptyDocumentsState from './EmptyDocumentsState';
import DocumentsTable from './DocumentsTable';
import OtpVerificationDialog from './OtpVerificationDialog';
import PanVerificationDialog from './PanVerificationDialog';
import VerificationDialog from './VerificationDialog';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments, fetchEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);
  
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showPanDialog, setShowPanDialog] = useState(false);
  
  useEffect(() => {
    fetchEmployeeDocuments(employeeId);
  }, [employeeId, fetchEmployeeDocuments]);

  const handleViewDocument = (doc: VerificationDocument) => {
    setSelectedDocument(doc);
    setShowVerificationDialog(true);
  };

  const handleVerifyAadhar = (doc: VerificationDocument) => {
    setSelectedDocument(doc);
    setShowOtpDialog(true);
  };

  const handleVerifyPan = (doc: VerificationDocument) => {
    setSelectedDocument(doc);
    setShowPanDialog(true);
  };

  const handleVerificationComplete = () => {
    // Refresh documents after verification
    fetchEmployeeDocuments(employeeId);
  };

  if (documents.length === 0) {
    return (
      <EmptyDocumentsState onAddDocument={onAddDocument} />
    );
  }

  // Sort documents by creation date (newest first)
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </h3>
        {onAddDocument && (
          <Button onClick={onAddDocument} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Document
          </Button>
        )}
      </div>

      <div className="space-y-4 mb-8 hidden sm:block">
        <DocumentsTable 
          documents={sortedDocuments} 
          onView={handleViewDocument}
          onVerifyAadhar={handleVerifyAadhar}
          onVerifyPan={handleVerifyPan}
        />
      </div>

      <div className="space-y-4 sm:hidden">
        {sortedDocuments.map((document) => (
          <Card key={document.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <DocumentCard 
                document={document} 
                onView={() => handleViewDocument(document)}
                onVerifyAadhar={() => handleVerifyAadhar(document)}
                onVerifyPan={() => handleVerifyPan(document)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedDocument && showVerificationDialog && (
        <VerificationDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          document={selectedDocument}
        />
      )}
      
      {selectedDocument && selectedDocument.documentNumber && showOtpDialog && (
        <OtpVerificationDialog 
          isOpen={showOtpDialog}
          onClose={() => setShowOtpDialog(false)}
          documentId={selectedDocument.id}
          documentNumber={selectedDocument.documentNumber}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
      
      {selectedDocument && selectedDocument.documentNumber && showPanDialog && (
        <PanVerificationDialog
          isOpen={showPanDialog}
          onClose={() => setShowPanDialog(false)}
          documentId={selectedDocument.id}
          documentNumber={selectedDocument.documentNumber}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default DocumentsList;
