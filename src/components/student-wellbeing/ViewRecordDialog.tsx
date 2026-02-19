import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, MessageSquare, Zap, Paperclip, FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { cn, buildPublicStorageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  StudentWellbeingRecord,
  StudentWellbeingConsultation,
  ConsultationActionTaken,
} from '@/services/student-wellbeing/studentWellbeingService';

const BUCKET = 'student_well_begin_attachements';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatStatus(status: string): string {
  return status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'under_observation':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'closed':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function formatConsultationDate(value: string): string {
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatActionDate(value: string): string {
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

const scrollableClass = 'flex-1 min-h-0 max-h-[55vh] overflow-y-auto no-scrollbar';

export interface ViewRecordDialogProps {
  open: boolean;
  onClose: () => void;
  record: StudentWellbeingRecord | null;
}

export function ViewRecordDialog({ open, onClose, record }: ViewRecordDialogProps) {
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  const getPublicUrl = (path: string): string | null => {
    try {
      return buildPublicStorageUrl(path, BUCKET) || null;
    } catch {
      return null;
    }
  };

  const handleView = (path: string) => {
    const url = getPublicUrl(path);
    if (url) window.open(url, '_blank');
  };

  const handleDownload = async (path: string, name: string) => {
    const url = getPublicUrl(path);
    if (!url) return;
    setDownloadingPath(path);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch file');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Could not download file. It may be missing or the link may have expired.');
    } finally {
      setDownloadingPath(null);
    }
  };

  if (!record) return null;

  const consultations = record.consultations ?? [];
  const actions = record.actions ?? [];
  const attachments = record.document_url ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <TooltipProvider delayDuration={300}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5" />
            View Well-Being Record
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0 w-full grid grid-cols-4">
            <TabsTrigger value="details" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="consultations" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Consultation
              <span className="ml-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 text-xs font-medium">
                {record.consultations?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Action
              <span className="ml-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 text-xs font-medium">
                {record.actions?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              Attachments
              <span className="ml-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 text-xs font-medium">
                {record.document_url?.length ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden">
            <div className={`${scrollableClass} space-y-4 pr-1`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</p>
                  <p className="text-sm font-medium mt-0.5">{record.student_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grade / Section</p>
                  <p className="text-sm mt-0.5">{record.class ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type of Concern</p>
                  <p className="text-sm mt-0.5">{record.concern ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Observation</p>
                  <p className="text-sm mt-0.5">{formatDate(record.date_of_observation)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium mt-1',
                      getStatusBadgeClass(record.status ?? '')
                    )}
                  >
                    {formatStatus(record.status ?? '')}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brief Concern Description</p>
                <div className="mt-1.5 rounded-md border bg-muted/30 px-3 py-2.5">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {record.concern_notes || '—'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consultations" className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden">
            <div className={`${scrollableClass} space-y-4 py-2 pr-1`}>
              {consultations.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No consultations recorded yet.</p>
              ) : (
                consultations.map((c: StudentWellbeingConsultation) => (
                  <div key={c.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consultation provided by</p>
                        <p className="text-sm font-medium mt-0.5">{c.consultation_provided_by}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                        <p className="text-sm mt-0.5">{formatConsultationDate(c.consultation_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mode</p>
                        <p className="text-sm mt-0.5">{c.mode_name ?? '—'}</p>
                      </div>
                    </div>
                    {c.support_notes && (
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Support / Consultation notes</p>
                        <div className="mt-1.5 rounded-md border border-amber-100 bg-white/60 px-3 py-2.5">
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{c.support_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden">
            <div className={`${scrollableClass} space-y-4 py-2 pr-1`}>
              {actions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No actions recorded yet.</p>
              ) : (
                actions.map((a: ConsultationActionTaken) => (
                  <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                      <p className="text-sm font-medium mt-0.5">{formatActionDate(a.taken_date)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Description</p>
                      <div className="mt-1.5 rounded-md border border-amber-100 bg-white/60 px-3 py-2.5">
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{a.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden">
            <div className={`${scrollableClass} space-y-2 py-2 pr-1`}>
              {attachments.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No attachments.</p>
              ) : (
                attachments.map((doc, i) => (
                  <div
                    key={`${doc.path}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm truncate min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(doc.path)}
                            aria-label="View file in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View in new tab</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={downloadingPath === doc.path}
                            onClick={() => handleDownload(doc.path, doc.name)}
                            aria-label="Download file"
                          >
                            {downloadingPath === doc.path ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
