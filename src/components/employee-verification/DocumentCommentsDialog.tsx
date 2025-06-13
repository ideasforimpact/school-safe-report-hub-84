
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  documentId?: string;
}

const DocumentCommentsDialog: React.FC<DocumentCommentsDialogProps> = ({
  open,
  onOpenChange,
  verificationHistory,
  documentId
}) => {
  const { toast } = useToast();

  const handleDownloadAttachment = async (attachmentUrl: string, index: number) => {
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = attachmentUrl;
      link.download = `attachment-${index + 1}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Attachment download has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Download Error",
        description: "Failed to download attachment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActionBadge = (action: string) => {
    if (action === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else if (action === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verification History & Comments
          </DialogTitle>
          <DialogDescription>
            Complete verification history with comments and attachments for this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verificationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No verification history available for this document.</p>
            </div>
          ) : (
            verificationHistory.map((entry, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    <span className="text-sm text-gray-600">
                      Entry #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Verified by:</span>
                    <span>{entry.verified_by}</span>
                  </div>

                  {entry.comments && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Comments:</h4>
                      <div className="bg-white p-3 rounded border text-sm">
                        {entry.comments}
                      </div>
                    </div>
                  )}

                  {entry.attachments && entry.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        Attachments ({entry.attachments.length}):
                      </h4>
                      <div className="space-y-2">
                        {entry.attachments.map((attachment, attachmentIndex) => (
                          <div key={attachmentIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                Attachment {attachmentIndex + 1}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment, attachmentIndex)}
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
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCommentsDialog;
