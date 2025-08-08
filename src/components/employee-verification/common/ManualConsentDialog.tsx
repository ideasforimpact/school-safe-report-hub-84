import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ManualConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypeName?: string;
  employeeName?: string;
  onApprove: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
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
    ? `Please review ${employeeName}'s document and confirm their consent for manual verification.`
    : 'Please review the document and confirm user consent for manual verification.';

  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmed(false);
    }
  }, [open, successState]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center py-1">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
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
                Document Type: {documentTypeName || 'Document'}
              </span>
            </div>
            <div className="rounded-md border p-3 flex items-start gap-3">
              <Checkbox
                id="consent-confirm"
                checked={confirmed}
                onCheckedChange={(val) => setConfirmed(Boolean(val))}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="consent-confirm" className="text-sm font-medium">
                  I confirm that I have reviewed the submitted document and verify that it meets all compliance requirements and authenticity standards according to company policy.
                </Label>
              </div>
            </div>
          </div>
        )}

        {!successState && (
          <DialogFooter className="flex justify-center sm:justify-end mt-2 gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={onReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject
            </Button>
            <Button variant="success" onClick={onApprove} disabled={!confirmed || isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualConsentDialog;
