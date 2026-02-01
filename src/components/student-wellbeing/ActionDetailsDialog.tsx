import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import type { StudentWellbeingRecord, ConsultationActionTaken } from '@/services/student-wellbeing/studentWellbeingService';

function formatActionDate(value: string): string {
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export interface ActionDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  record: StudentWellbeingRecord | null;
}

export function ActionDetailsDialog({
  open,
  onClose,
  record,
}: ActionDetailsDialogProps) {
  const actions = record?.actions ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col w-full">
        <DialogHeader className="space-y-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5" />
            Action Details
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 py-2">
          {actions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No actions recorded yet for this well-being record.
            </p>
          ) : (
            actions.map((a: ConsultationActionTaken) => (
              <ActionCard key={a.id} action={a} />
            ))
          )}
        </div>
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionCard({ action }: { action: ConsultationActionTaken }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
          <p className="text-sm font-medium mt-0.5">{formatActionDate(action.taken_date)}</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Description</p>
        <div className="mt-1.5 rounded-md border border-amber-100 bg-white/60 px-3 py-2.5">
          <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {action.description}
          </p>
        </div>
      </div>
    </div>
  );
}
