import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDocumentTypeName } from '@/components/employee-verification/utils/documentUtils';

interface ManualConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypeName?: string;
  employeeName?: string;
  onApprove: () => Promise<void> | void;
  onReject: (reason: string) => Promise<void> | void;
  isProcessing?: boolean;
  successState?: 'verified' | 'rejected' | null;
}

const ManualConsentDialog: React.FC<ManualConsentDialogProps> = ({
  open,
  onOpenChange,
  documentTypeName,
  employeeName,
  onApprove,
  onReject,
  isProcessing = false,
  successState = null,
}) => {
  const title = 'Document Verification Required';
  const description = employeeName
    ? `Please review ${employeeName}'s document and confirm their consent for Manual Verification.`
    : 'Please review the document and confirm user consent for Manual Verification.';

  const displayDocType = documentTypeName ? formatDocumentTypeName(documentTypeName) : 'Document';

  const [confirmed, setConfirmed] = useState(false);
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (open) {
      setConfirmed(false);
      setActiveAction(null);
      setShowRejectForm(false);
      setRejectReason('');
    }
  }, [open, successState]);

  useEffect(() => {
    console.log('🔍 ManualConsentDialog state:', { 
      open, 
      isProcessing, 
      successState, 
      confirmed 
    });
  }, [open, isProcessing, successState, confirmed]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center py-1">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        {successState ? (
          <div className="flex flex-col items-center gap-3 py-6">
            {successState === 'verified' ? (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
            <p className="text-base font-medium">
              {successState === 'verified' ? 'Verified' : 'Rejected'}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              The document status has been updated.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-start">
              <span className="text-sm text-muted-foreground">
                Document Type: <span className="font-semibold">{displayDocType}</span>
              </span>
            </div>
                                                                                                                                                                                                                                                                                                                                                                                                <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="consent-confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
              />
              <label htmlFor="consent-confirm" className="text-sm text-muted-foreground cursor-pointer">
                I confirm that I have reviewed the submitted document and verify that it meets all compliance requirements and authenticity standards according to company policy.
              </label>
            </div>
          </div>
        )}

        {!successState && !showRejectForm && (
          <DialogFooter className="flex justify-center sm:justify-end mt-2 gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                setShowRejectForm(true);
              }}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button 
              variant="success" 
              onClick={async () => {
                setActiveAction('approve');
                console.log('🔍 Approve button clicked');
                try {
                  await onApprove();
                } catch (error) {
                  console.error('Approve error:', error);
                } finally {
                  setActiveAction(null);
                }
              }} 
              disabled={!confirmed || isProcessing}
            >
              {isProcessing && activeAction === 'approve' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Approve
            </Button>
          </DialogFooter>
        )}

        {!successState && showRejectForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-sm font-medium">
                Reason for reject <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Please provide a reason for rejecting this document..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <DialogFooter className="flex justify-center sm:justify-end mt-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    return; // Don't proceed if reason is empty
                  }
                  setActiveAction('reject');
                  console.log('🔍 Reject button clicked with reason:', rejectReason);
                  try {
                    await onReject(rejectReason.trim());
                  } catch (error) {
                    console.error('Reject error:', error);
                  } finally {
                    setActiveAction(null);
                  }
                }}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing && activeAction === 'reject' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Confirm Reject
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualConsentDialog;
