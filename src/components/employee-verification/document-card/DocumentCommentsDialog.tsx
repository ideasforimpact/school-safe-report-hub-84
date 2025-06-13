
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, FileText, Download, Calendar, User } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';

interface DocumentCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocument;
}

const DocumentCommentsDialog: React.FC<DocumentCommentsDialogProps> = ({
  open,
  onOpenChange,
  document
}) => {
  // Get verification history from params
  const verificationHistory = document.params?.verification_history || [];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Verification Comments - {document.documentTypeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Document Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Document ID:</span> {document.id.slice(0, 8)}...
              </div>
              <div>
                <span className="font-medium">Current Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getActionBadgeColor(document.verificationStatus)}`}>
                  {document.verificationStatus}
                </span>
              </div>
              {document.documentNumber && (
                <div className="col-span-2">
                  <span className="font-medium">Document Number:</span> {document.documentNumber}
                </div>
              )}
            </div>
          </div>

          {/* Verification History */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Verification History ({verificationHistory.length} entries)
            </h4>
            
            {verificationHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No verification comments available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Comments will appear here when verification actions are taken
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {verificationHistory.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(entry.action)}`}>
                          {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.verified_by}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    
                    {/* Comments */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Comments:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {entry.comments || 'No comments provided'}
                      </p>
                    </div>
                    
                    {/* Attachments */}
                    {entry.attachments && entry.attachments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Attachments ({entry.attachments.length}):
                        </p>
                        <div className="space-y-2">
                          {entry.attachments.map((attachment, attachmentIndex) => (
                            <div key={attachmentIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 flex-1">
                                Attachment {attachmentIndex + 1}
                              </span>
                              <a
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCommentsDialog;
