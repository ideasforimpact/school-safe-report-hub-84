import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BackofficeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  verifyLabel?: string;
  cancelLabel?: string;
  isVerifying?: boolean;
  errorMessage?: string | null;
  onVerify: () => void | Promise<void>;
  onCancel?: () => void;
  children?: React.ReactNode;
}

const BackofficeVerificationDialog: React.FC<BackofficeVerificationDialogProps> = ({
  open,
  onOpenChange,
  title = 'API Document Verification',
  description = 'Verify employee data through automated API validation',
  verifyLabel = 'Verify',
  cancelLabel = 'Cancel',
  isVerifying = false,
  errorMessage = null,
  onVerify,
  onCancel,
  children
}) => {
  const { toast } = useToast();

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleVerify = async () => {
    await Promise.resolve(onVerify());
    toast({
      title: 'Verification Successful',
      description: 'Verified successfully.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'sm:rounded-lg max-w-lg mx-auto'
          )}
        >
          {errorMessage && (
            <div className="mt-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <DialogHeader className="text-center">
            <div className="flex justify-center py-1">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold text-center">{title}</DialogTitle>
            <DialogDescription className="text-center text-sm">{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {children ?? (
              <div className="text-sm text-muted-foreground text-center">
                Click verify to process this document.
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-center sm:justify-end mt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isVerifying}>
              {cancelLabel}
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying} className="ml-2">
              {isVerifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {verifyLabel}
            </Button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};

export default BackofficeVerificationDialog;
