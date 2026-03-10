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
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { REOPEN_REASON_MAX_LENGTH } from '@/components/constants';

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
        
        <div>
          <Label htmlFor="reopen-reason" className="text-sm font-medium">
            Reason for Reopening <span className="text-red-500">*</span>
          </Label>
          <TextareaWithVoice
            id="reopen-reason"
            placeholder="Enter the reason for reopening this incident..."
            value={reopenReason}
            onChange={(e) => onReopenReasonChange(e.target.value)}
            className="mt-2"
            maxLength={REOPEN_REASON_MAX_LENGTH}
            rows={3}
          />
        </div>
        <div className="text-xs text-gray-500 text-right">
          {reopenReason.length}/{REOPEN_REASON_MAX_LENGTH} characters
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