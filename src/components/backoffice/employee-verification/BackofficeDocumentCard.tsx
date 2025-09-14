import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, User, Hash, Shield, Upload, MessageCircle } from 'lucide-react';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import DocumentReUploadDialog from './DocumentReUploadDialog';
import DocumentVerificationDialog from './DocumentVerificationDialog';
import DocumentCommentsDialog from '../../employee-verification/DocumentCommentsDialog';
import { backofficeDocumentService } from '@/services/employee/backofficeDocumentService';

interface BackofficeDocumentCardProps {
  document: VerificationDocument;
  documentTypeName: string;
  employee: Employee;
  onRefresh: () => void;
}

const BackofficeDocumentCard: React.FC<BackofficeDocumentCardProps> = ({
  document,
  documentTypeName,
  employee,
  onRefresh
}) => {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [reUploadDialogOpen, setReUploadDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get the client ID - try both field names for compatibility
  const clientId = employee.clientId || (employee as any).client_id;
  
  console.log('BackofficeDocumentCard - Document:', {
    id: document.id,
    verificationStatus: document.verificationStatus,
    documentTypeName,
    documentImage: document.documentImage ? 'present' : 'missing',
    resolvedClientId: clientId
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDocumentTypeIcon = (typeName: string) => {
    const lowerTypeName = typeName.toLowerCase();
    if (lowerTypeName.includes('other')) {
      return '📄';
    }
    return '📄';
  };

  const formatDocumentTypeName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleDownload = () => {
    if (document.documentImage) {
      const link = window.document.createElement('a');
      link.href = document.documentImage;
      link.download = `${employee.name}_${documentTypeName}_${document.id}.jpg`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleViewImage = () => {
    if (document.documentImage) {
      try {
        window.open(document.documentImage, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error opening document:', error);
        setImagePreviewOpen(true);
      }
    } else {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
    }
  };

  const handleVerify = () => {
    console.log('BackofficeDocumentCard - Verify button clicked for document:', document.id);
    setVerificationDialogOpen(true);
  };

  const handleReUpload = () => {
    console.log('BackofficeDocumentCard - Re-upload button clicked for document:', document.id);
    setReUploadDialogOpen(true);
  };

  const handleDocumentUpdated = () => {
    console.log('BackofficeDocumentCard - Document updated, refreshing data');
    onRefresh();
  };

  // Helper function to check if document has comments
  const hasVerificationHistory = (): boolean => {
    const verificationHistory = (document.params as any)?.verification_history;
    return Array.isArray(verificationHistory) && verificationHistory.length > 0;
  };

  // Handle updating verification history with proper backend call
  const handleUpdateHistory = async (updatedHistory: any[]) => {
    try {
      console.log('BackofficeDocumentCard - Updating verification history:', updatedHistory);
      
      // Call the backend service to update verification history
      await backofficeDocumentService.updateVerificationHistory({
        documentId: document.id,
        clientId: clientId!,
        employeeId: employee.id,
        verificationHistory: updatedHistory,
      });
      
      // Call the refresh function to reload the document data
      onRefresh();
      
      toast({
        title: "History Updated",
        description: "Verification history has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating verification history:', error);
      toast({
        title: "Update Error",
        description: "Failed to update verification history. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if this is a "Manual" document type with verification history
  const showCommentsIcon = document.documentTypeName.toLowerCase() === 'manual' && hasVerificationHistory();

  const handleCommentsClick = () => {
    console.log('BackofficeDocumentCard - Comments button clicked for document:', document.id);
    setCommentsDialogOpen(true);
    
    toast({
      title: "Viewing Comments",
      description: "Showing verification history and comments for this document."
    });
  };

  // Check if this is a "Manual" document with "in-progress" status
  const isManualInProgress = document.documentTypeName.toLowerCase() === 'manual' && document.verificationStatus === 'in-progress';
  
  console.log('BackofficeDocumentCard - Button conditions:', {
    isManualInProgress,
    documentTypeName: documentTypeName.toLowerCase(),
    verificationStatus: document.verificationStatus,
    hasDocumentImage: !!document.documentImage,
    hasClientId: !!clientId,
    document:document
  });

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-2xl">{getDocumentTypeIcon(documentTypeName)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">
                    {formatDocumentTypeName(documentTypeName)}
                  </h3>
                  {getStatusBadge(document.verificationStatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>Document ID: {document.id.slice(0, 8)}...</span>
                  </div>
                  
                  {document.documentNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Number: {document.documentNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded: {format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Employee: {employee.name}</span>
                  </div>
                </div>

                {document.verificationDate && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Verified: {format(new Date(document.verificationDate), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                )}

                {document.verificationNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Notes:</strong> {document.verificationNotes}</p>
                  </div>
                )}

                {document.details && Object.keys(document.details).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Verification Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(document.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show verification history if available but no comments icon */}
                {document.params && (document.params as any).verification_history && !showCommentsIcon && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Verification History:</p>
                    <div className="space-y-2 text-sm">
                      {((document.params as any).verification_history || []).map((entry: any, index: number) => (
                        <div key={index} className="border-l-2 border-yellow-300 pl-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{entry.action}</span>
                            <span className="text-gray-500">{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          {entry.comments && <p className="text-gray-600 mt-1">{entry.comments}</p>}
                          {entry.attachments && entry.attachments.length > 0 && (
                            <p className="text-gray-500 text-xs mt-1">{entry.attachments.length} attachment(s)</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {/* Comments button - for "Other" documents with verification history */}
              {showCommentsIcon && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCommentsClick}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  title="View and edit comments and verification history"
                >
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </Button>
              )}
              
              {/* Verify button - only for "Manual" documents with "in-progress" status */}
              {isManualInProgress && clientId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Verify
                </Button>
              )}
              
              {/* Re-upload button - only for "Manual" document types with documentImage and clientId */}
              {document.documentTypeName.toLowerCase() === 'manual' && document.documentImage && clientId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReUpload}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Re-upload
                </Button>
              )}
              
              {/* View and Download as icon buttons */}
              {document.documentImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleViewImage}
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {imagePreviewOpen && document.documentImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img
              src={document.documentImage}
              alt={`${documentTypeName} for ${employee.name}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Error loading image:', e);
                toast({
                  title: "Image Load Error",
                  description: "Failed to load the document image.",
                  variant: "destructive",
                });
                setImagePreviewOpen(false);
              }}
            />
            <Button
              variant="outline"
              className="absolute top-4 right-4 bg-white text-black"
              onClick={() => setImagePreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Re-upload Dialog */}
      <DocumentReUploadDialog
        open={reUploadDialogOpen}
        onOpenChange={setReUploadDialogOpen}
        document={document}
        employee={employee}
        onDocumentUpdated={handleDocumentUpdated}
      />

      {/* Verification Dialog */}
      <DocumentVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        document={document}
        employee={employee}
        onDocumentUpdated={handleDocumentUpdated}
      />

      {/* Comments Dialog with Edit Functionality */}
      <DocumentCommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        verificationHistory={(document.params as any)?.verification_history || []}
        documentId={document.id}
        onUpdateHistory={handleUpdateHistory}
      />
    </>
  );
};

export default BackofficeDocumentCard;
