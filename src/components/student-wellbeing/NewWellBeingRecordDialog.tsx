import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { StudentSearchSelect, type StudentOption } from './StudentSearchSelect';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import type { FileItem } from '@/types/fileTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

const ATTACHMENTS_MAX_FILES = 5;
const ATTACHMENTS_MAX_SIZE_MB = 10;
const ATTACHMENTS_MAX_TOTAL_MB = ATTACHMENTS_MAX_FILES * ATTACHMENTS_MAX_SIZE_MB;

const CONCERN_MIN = 2;
const CONCERN_MAX = 2000;
const CONCERN_NO_SPECIAL = /^[a-zA-Z0-9\s.,?!'\-_\n\r]*$/;

export interface NewWellBeingRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewWellBeingRecordDialog({
  open,
  onClose,
  onSuccess,
}: NewWellBeingRecordDialogProps) {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  const [student, setStudent] = useState<StudentOption | null>(null);
  const [typeOfConcernId, setTypeOfConcernId] = useState<string>('');
  const [dateOfObservation, setDateOfObservation] = useState<Date | undefined>(new Date());
  const [concern, setConcern] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [generalConcernOptions, setGeneralConcernOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOptions(true);
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from('general_concern')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (cancelled) return;
      setLoadingOptions(false);
      if (error) {
        toast.error('Failed to load concern types');
        return;
      }
      const list: { id: string; name: string }[] = Array.isArray(data) ? data : [];
      setGeneralConcernOptions(list);
      if (list.length > 0) {
        const general = list.find((r) => r.name === 'General Concern');
        setTypeOfConcernId(general?.id ?? list[0].id);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!student) next.student = 'Please select a student';
    if (!typeOfConcernId) next.typeOfConcern = 'Please select type of concern';
    if (!dateOfObservation) next.date = 'Please select date of observation';
    const len = concern.trim().length;
    if (len < CONCERN_MIN) next.concern = `At least ${CONCERN_MIN} characters required`;
    else if (len > CONCERN_MAX) next.concern = `Maximum ${CONCERN_MAX} characters allowed`;
    else if (!CONCERN_NO_SPECIAL.test(concern)) next.concern = 'Special characters are not allowed';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isFormValid =
    !!student &&
    !!typeOfConcernId &&
    !!dateOfObservation &&
    concern.trim().length >= CONCERN_MIN &&
    concern.trim().length <= CONCERN_MAX &&
    CONCERN_NO_SPECIAL.test(concern);

  const handleSave = async () => {
    if (!clientId || !employeeId) {
      toast.error('Missing client or employee context');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    setApiError(null);
    try {
      const attachmentsPayload = attachmentFiles.map((f) => ({
        name: f.name,
        type: f.type,
        base64: f.base64?.replace(/^data:[^;]+;base64,/, '') ?? '',
      }));

      const { data, error } = await supabase.functions.invoke('create-student-wellbeing-record', {
        method: 'POST',
        body: {
          client_id: clientId,
          employee_id: employeeId,
          student_id: student!.id,
          section_id: student!.section_id ?? null,
          grade_id: student!.grade_id ?? null,
          type_of_concern_id: typeOfConcernId,
          date_of_observation: dateOfObservation!.toISOString(),
          concern: concern.trim() || null,
          attachments: attachmentsPayload,
        },
      });

      const friendlyMessage =
        (typeof data?.error === 'string' ? data.error : null) ||
        error?.message ||
        'Failed to save record';

      if (error || data?.success === false) {
        setApiError(friendlyMessage);
        toast.error(friendlyMessage);
        setSaving(false);
        return;
      }

      toast.success('Record saved');
      setStudent(null);
      setTypeOfConcernId('');
      setDateOfObservation(new Date());
      setConcern('');
      setAttachmentFiles([]);
      setErrors({});
      setApiError(null);
      onSuccess();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save record';
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setStudent(null);
      setTypeOfConcernId('');
      setDateOfObservation(new Date());
      setConcern('');
      setAttachmentFiles([]);
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>New Well-Being Record</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0 no-scrollbar">
          {apiError && (
            <Alert variant="destructive" className="flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="student">Student <span className="text-red-500">*</span></Label>
            <StudentSearchSelect
              value={student}
              onChange={setStudent}
              placeholder="Select student..."
              disabled={saving}
              className={errors.student ? 'border-red-500' : ''}
            />
            {errors.student && (
              <p className="text-sm text-red-500">{errors.student}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="typeOfConcern">Type of Concern <span className="text-red-500">*</span></Label>
            <Select
              value={typeOfConcernId}
              onValueChange={setTypeOfConcernId}
              disabled={saving || loadingOptions}
            >
              <SelectTrigger className={errors.typeOfConcern ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select type of concern" />
              </SelectTrigger>
              <SelectContent>
                {generalConcernOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.typeOfConcern && (
              <p className="text-sm text-red-500">{errors.typeOfConcern}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Date of Observation <span className="text-red-500">*</span></Label>
            <DatePicker
              date={dateOfObservation}
              onChange={setDateOfObservation}
              placeholderText="Select date"
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="concern">Brief Concern Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="concern"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Use simple, non-judgmental language"
              rows={4}
              disabled={saving}
              className={`resize-y min-h-[80px] ${errors.concern ? 'border-red-500' : ''}`}
              maxLength={CONCERN_MAX + 100}
            />
            <p className="text-xs text-gray-500">
              {concern.trim().length} / {CONCERN_MAX}
            </p>
            {errors.concern && (
              <p className="text-sm text-red-500">{errors.concern}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Attachments</Label>
            <ReusableFileUploader
              onFilesChange={setAttachmentFiles}
              initialFiles={[]}
              maxFiles={ATTACHMENTS_MAX_FILES}
              maxSize={ATTACHMENTS_MAX_SIZE_MB}
              maxTotalSize={ATTACHMENTS_MAX_TOTAL_MB}
              showFileList={true}
              disabled={saving}
              className={errors.attachments ? 'border-red-500' : ''}
            />
            {errors.attachments && (
              <p className="text-sm text-red-500">{errors.attachments}</p>
            )}
          </div>
        </div>

        {saving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 flex-shrink-0 border-t pt-4 mt-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isFormValid}>
            Save Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
