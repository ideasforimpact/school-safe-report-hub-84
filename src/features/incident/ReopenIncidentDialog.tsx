import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReopenIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reopenReason: string;
  onReopenReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

const ReopenIncidentDialog: React.FC<ReopenIncidentDialogProps> = ({
  open,
  onOpenChange,
  reopenReason,
  onReopenReasonChange,
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reopen Incident</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for reopening this incident. This action will change the incident status back to Open and will be logged in the audit trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="reopen-reason" className="text-sm font-medium">
            Reason for Reopening *
          </Label>
          <Textarea
            id="reopen-reason"
            placeholder="Enter the reason for reopening this incident..."
            value={reopenReason}
            onChange={(e) => onReopenReasonChange(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={!reopenReason.trim()}
          >
            Confirm Reopen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReopenIncidentDialog;