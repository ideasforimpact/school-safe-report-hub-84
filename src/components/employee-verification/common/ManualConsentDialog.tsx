import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const title = 'Manual Verification Consent';
  const description = 'Please confirm you have reviewed the document and the user consent for manual verification.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm">{description}</DialogDescription>
        </DialogHeader>

        {successState ? (
          <div className="flex flex-col items-center gap-3 py-6">
            {successState === 'verified' ? (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
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
            <div className="rounded-md border p-3">
              <div className="text-sm">Document type</div>
              <div className="text-base font-medium">{documentTypeName || 'Document'}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm">Employee</div>
              <div className="text-base font-medium">{employeeName || 'Employee'}</div>
            </div>
          </div>
        )}

        {!successState && (
          <DialogFooter className="flex justify-center sm:justify-end mt-2 gap-2">
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject
            </Button>
            <Button onClick={onApprove} disabled={isProcessing}>
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
