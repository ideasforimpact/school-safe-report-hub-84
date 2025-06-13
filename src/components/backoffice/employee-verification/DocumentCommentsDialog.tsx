
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationHistoryEntry {
  action: 'completed' | 'rejected';
  comments: string;
  attachments: string[];
  timestamp: string;
  verified_by: string;
}

interface DocumentCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificationHistory: VerificationHistoryEntry[];
  documentId: string;
}

const DocumentCommentsDialog: React.FC<DocumentCommentsDialogProps> = ({
  open,
  onOpenChange,
  verificationHistory,
  documentId
}) => {
  const handleDownloadAttachment = (attachmentUrl: string, fileName?: string) => {
    try {
      const link = window.document.createElement('a');
      link.href = attachmentUrl;
      link.download = fileName || `attachment-${Date.now()}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verification Comments & History</DialogTitle>
          <DialogDescription>
            View verification history, comments, and attachments for this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {verificationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No verification history available
            </div>
          ) : (
            verificationHistory.map((entry, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-gray-50 space-y-3"
              >
                {/* Header with action and timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    <span className="text-sm text-gray-600">
                      Action #{verificationHistory.length - index}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                {/* Verified by */}
                {entry.verified_by && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Verified by: {entry.verified_by}</span>
                  </div>
                )}

                {/* Comments */}
                {entry.comments && (
                  <div className="bg-white rounded p-3 border-l-4 border-blue-200">
                    <p className="text-sm font-medium mb-1">Comments:</p>
                    <p className="text-sm text-gray-700">{entry.comments}</p>
                  </div>
                )}

                {/* Attachments */}
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Attachments ({entry.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {entry.attachments.map((attachment, attachIndex) => (
                        <div
                          key={attachIndex}
                          className="flex items-center justify-between bg-white rounded p-2 border"
                        >
                          <span className="text-sm text-gray-600 truncate">
                            Attachment {attachIndex + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment, `attachment-${attachIndex + 1}`)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCommentsDialog;
