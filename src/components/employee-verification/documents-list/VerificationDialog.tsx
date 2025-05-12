
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes?: string) => Promise<void>;
  document: VerificationDocument | null;
}

const VerificationDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  document 
}: VerificationDialogProps) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes);
      setNotes('');
    } catch (error) {
      console.error('Error updating document status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerifying = document?.verificationStatus === 'pending';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isVerifying ? 'Verify Document' : 'Fail Document Verification'}
          </DialogTitle>
          <DialogDescription>
            {isVerifying 
              ? 'Add verification notes to confirm document authenticity.'
              : 'Provide details about why this document failed verification.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or observations about this document's verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              isVerifying ? 'Verify Document' : 'Mark as Failed'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
