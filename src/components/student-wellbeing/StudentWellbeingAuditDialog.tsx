import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Clock } from 'lucide-react';
import type { StudentWellbeingRecord } from '@/services/student-wellbeing/studentWellbeingService';
import {
  fetchStudentWellbeingAuditLog,
  formatStudentWellbeingAuditEntries,
  type FormattedStudentWellbeingAuditEntry,
} from '@/services/student-wellbeing/studentWellbeingAuditService';

export interface StudentWellbeingAuditDialogProps {
  open: boolean;
  onClose: () => void;
  record: StudentWellbeingRecord | null;
}

export const StudentWellbeingAuditDialog: React.FC<StudentWellbeingAuditDialogProps> = ({
  open,
  onClose,
  record,
}) => {
  const [entries, setEntries] = useState<FormattedStudentWellbeingAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !record) {
      setEntries([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = await fetchStudentWellbeingAuditLog(record.id);
        if (cancelled) return;
        const formatted = await formatStudentWellbeingAuditEntries(raw);
        if (cancelled) return;
        setEntries(formatted);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load student wellbeing audit log:', err);
        setError('Failed to load audit trail. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, record]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Activity Timeline
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading audit trail...
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 py-4">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No changes logged yet for this record.
            </p>
          ) : (
            <ol className="space-y-4">
              {entries.map((entry, index) => (
                <li key={entry.id} className="relative pl-10">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center">
                    <span className="h-8 w-px bg-gray-200" />
                  </div>
                  {/* Avatar circle */}
                  <div className="absolute left-1 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    S
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${entry.badgeClass}`}
                      >
                        {entry.badgeLabel}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {entry.relativeTime}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-0.5">
                      {entry.title}
                    </p>
                    <p className="text-sm text-gray-700 mb-1.5">
                      {entry.details}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      by {entry.userName}
                    </p>
                    {entry.fromLabel && entry.toLabel && (
                      <div className="mt-1 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-gray-600">From:</span>{' '}
                          <span
                            title={entry.fromLabel}
                            className="inline-block max-w-[200px] truncate align-bottom"
                          >
                            {entry.fromLabel.length > 20
                              ? `${entry.fromLabel.slice(0, 20)}...`
                              : entry.fromLabel}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">To:</span>{' '}
                          <span
                            title={entry.toLabel}
                            className="inline-block max-w-[200px] truncate align-bottom"
                          >
                            {entry.toLabel.length > 20
                              ? `${entry.toLabel.slice(0, 20)}...`
                              : entry.toLabel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

