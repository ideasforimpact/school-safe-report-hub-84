
import React, { useState } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Download, Trash2, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { capitalize } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';
import VerificationStatusBadge from './VerificationStatusBadge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments, verifyDocument } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);
  const { toast } = useToast();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const formatDocumentType = (type: string) => {
    return capitalize(type.replace('_', ' '));
  };

  const handleViewDocument = (documentImage: string) => {
    window.open(documentImage, '_blank');
  };

  const handleDownloadDocument = (documentImage: string) => {
    const link = document.createElement('a');
    link.href = documentImage;
    link.download = `document-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openVerifyDialog = (documentId: string) => {
    setSelectedDocument(documentId);
    setVerifyDialogOpen(true);
  };

  const handleVerify = async (method: 'api' | 'manual') => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Simulate verification delay
      setTimeout(() => {
        verifyDocument(
          selectedDocument,
          'verified',
          method === 'api' 
            ? 'Document automatically verified successfully.' 
            : 'Document manually verified successfully.',
          method
        );
        
        toast({
          title: "Document Verified",
          description: `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.`,
        });
        
        setVerifying(false);
        setVerifyDialogOpen(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  };

  const rejectDocument = () => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Simulate verification delay
      setTimeout(() => {
        verifyDocument(
          selectedDocument,
          'failed',
          'Failed to verify document. Details do not match records.'
        );
        
        toast({
          title: "Verification Failed",
          description: "Document verification failed.",
          variant: "destructive"
        });
        
        setVerifying(false);
        setVerifyDialogOpen(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {documents.length === 0 ? (
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
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{formatDocumentType(document.documentType)}</TableCell>
                  <TableCell>{document.documentNumber || 'N/A'}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <VerificationStatusBadge status={document.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDocument(document.documentImage)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadDocument(document.documentImage)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      {document.verificationStatus === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => openVerifyDialog(document.id)}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Verify Now
                        </Button>
                      )}
                      <DocumentDeleteButton documentId={document.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Choose a verification method for this document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button 
              variant="outline" 
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 justify-start"
              onClick={() => handleVerify('api')}
              disabled={verifying}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify via API
              <span className="ml-auto text-xs text-blue-500 font-normal">Automated check</span>
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
              onClick={() => handleVerify('manual')}
              disabled={verifying}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Manually
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              onClick={rejectDocument}
              disabled={verifying}
            >
              Reject
            </Button>
            <Button 
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={verifying}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsList;
