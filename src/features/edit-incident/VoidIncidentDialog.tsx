
import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface VoidIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voidReason: string;
  onVoidReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

const VoidIncidentDialog: React.FC<VoidIncidentDialogProps> = ({
  open,
  onOpenChange,
  voidReason,
  onVoidReasonChange,
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void This Incident</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the incident as voided but will keep it in the system for record-keeping purposes. 
            Voided incidents cannot be edited further.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="void-reason" className="text-sm font-medium">
            Reason for voiding (required)
          </Label>
          <Textarea
            id="void-reason"
            value={voidReason}
            onChange={(e) => onVoidReasonChange(e.target.value)}
            placeholder="Please provide a reason why this incident is being voided"
            className="mt-1"
            rows={3}
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={!voidReason.trim()}
          >
            Confirm Void
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VoidIncidentDialog;
