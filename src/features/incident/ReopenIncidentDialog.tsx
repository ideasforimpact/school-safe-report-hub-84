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
import { DemoActionButton } from '@/components/incidents/DemoActionButton';
import { getNextReopenScenario } from '@/demo_client/incident/auxiliaryDemo';

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
  // Demo Setup: cycle through three pre-canned reopen reasons. Calls
  // the same `onReopenReasonChange` callback the textarea uses, so the
  // existing length / disabled-state validation keeps working.
  const handleDemoReopenApply = () => {
    const text = getNextReopenScenario();
    if (text) onReopenReasonChange(text);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <AlertDialogTitle>Reopen Incident</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for reopening this incident. This action will change the incident status back to Open and will be logged in the audit trail.
              </AlertDialogDescription>
            </div>
            {/* Renders only when VITE_IS_DEMO_SETUP=true. Picks the
                next reopen-reason from auxiliaryScenarios.json. */}
            <DemoActionButton
              onActivate={handleDemoReopenApply}
              label="Fill demo reopen reason"
            />
          </div>
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