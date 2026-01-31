import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import type { StudentWellbeingRecord, StudentWellbeingConsultation } from '@/services/student-wellbeing/studentWellbeingService';

function formatConsultationDate(value: string): string {
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export interface ConsultationDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  record: StudentWellbeingRecord | null;
}

export function ConsultationDetailsDialog({
  open,
  onClose,
  record,
}: ConsultationDetailsDialogProps) {
  const consultations = record?.consultations ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col w-full">
        <DialogHeader className="space-y-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5" />
            Consultation Details
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 py-2">
          {consultations.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No consultations recorded yet for this well-being record.
            </p>
          ) : (
            consultations.map((c: StudentWellbeingConsultation) => (
              <ConsultationCard key={c.id} consultation={c} />
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

function ConsultationCard({ consultation }: { consultation: StudentWellbeingConsultation }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consultation provided by</p>
          <p className="text-sm font-medium mt-0.5">{consultation.consultation_provided_by}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
          <p className="text-sm mt-0.5">{formatConsultationDate(consultation.consultation_date)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mode</p>
          <p className="text-sm mt-0.5">{consultation.mode_name ?? '—'}</p>
        </div>
      </div>
      {consultation.support_notes && (
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Support / Consultation notes</p>
          <div className="mt-1.5 rounded-md border border-amber-100 bg-white/60 px-3 py-2.5">
            <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {consultation.support_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
