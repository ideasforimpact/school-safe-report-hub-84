import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
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
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useClientIntegrationEnabled } from '@/hooks/useClientIntegrationEnabled';
const ATTACHMENTS_MAX_FILES = 5;
const ATTACHMENTS_MAX_SIZE_MB = 10;
const ATTACHMENTS_MAX_TOTAL_MB = ATTACHMENTS_MAX_FILES * ATTACHMENTS_MAX_SIZE_MB;
 
const CONCERN_MIN = 5;
const CONCERN_MAX = 2000;
const CONCERN_NO_SPECIAL = /^[a-zA-Z0-9\s.,?!'\-_\n\r]*$/;
// Control future date selection from here
const allowFutureDate=false;
 
const CharacterCount = (text: string) => {
  const trimmed = text.trim();
  const matches = trimmed.match(/[^\s]/g);
  return matches ? matches.length : 0;
};
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
  const { isIntegrationEnabled } = useClientIntegrationEnabled();
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
  const [studentListVersion, setStudentListVersion] = useState(0);
  const handleStudentDeleted = (payload: any) => {
    if (payload.eventType !== 'DELETE') return;

    const deletedStudentId = payload.old?.id;

    if (student && deletedStudentId === student.id) {
      setStudent(null);

      setErrors((prev) => ({
        ...prev,
        student: 'Selected student was deleted. Please select another student.',
      }));

      toast.error('Selected student was deleted. Please select another student.');
    }
    setStudentListVersion((v) => v + 1);
  };

  useRealTimeSubHook({
    channelName: `students-${clientId}`,
    table: 'students',
    events: 'DELETE',
    enabled: open && !!clientId,
    onPayload: handleStudentDeleted,
  });

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
    const len = CharacterCount(concern);
    if (!CONCERN_NO_SPECIAL.test(concern)) {
      next.concern = 'Special characters are not allowed';
    } else if (len < CONCERN_MIN) {
      next.concern = `At least ${CONCERN_MIN} characters required`;
    } else if (len > CONCERN_MAX) {
      next.concern = `Maximum ${CONCERN_MAX} characters allowed`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const concernLength = CharacterCount(concern);

  const isFormValid =
    !!student &&
    !!typeOfConcernId &&
    !!dateOfObservation &&
    concernLength >= CONCERN_MIN &&
    concernLength <= CONCERN_MAX;
    
 
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
      const isExternalStudent = isIntegrationEnabled && student?.is_external === true;
      
      const externalStudentInvolved = isExternalStudent
        ? {
            student: {
              id: student?.student_id ?? null,
              name: student?.name ?? null,
            },
            grade: {
              id: student?.grade_id ?? null,
              name: student?.grade_name ?? null,
            },
            section: {
              id: student?.section_id ?? null,
              name: student?.section_name ?? null,
            },
          }
        : null;
          
      const { data, error } = await supabase.functions.invoke('create-student-wellbeing-record', {
        method: 'POST',
        body: {
          client_id: clientId,
          employee_id: employeeId,
          student_id: student!.id,
          section_id: student!.section_id ?? null,
          grade_id: student!.grade_id ?? null,
          student_name: student!.name ?? null,
          section_name: student!.section_name ?? null,
          grade_name: student!.grade_name ?? null,
          is_external_student: isExternalStudent,
          external_student_involved: externalStudentInvolved,
          type_of_concern_id: typeOfConcernId,
          date_of_observation: dateOfObservation!.toLocaleDateString('en-CA'),
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
 
      toast.success('Record was saved successfully');
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-y-auto no-scrollbar"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()} >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>New Well-Being Record</DialogTitle>
        </DialogHeader>
        <div className="flex-1 grid gap-4 py-4 pr-2">
          {apiError && (
            <Alert variant="destructive" className="flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="student">Student <span className="text-red-500">*</span></Label>
            <StudentSearchSelect
              refreshKey={studentListVersion}
              value={student}
              onChange={(value) => {
                setStudent(value);
                setErrors((prev) => {
                  const { student, ...rest } = prev;
                  return rest;
                });
              }}
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
              disableFuture={!allowFutureDate}
              placeholderText="Select date"
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>
 
          <div className="grid gap-2">
            <Label htmlFor="concern">Brief Concern Description <span className="text-red-500">*</span></Label>
            <TextareaWithVoice
              id="concern"
              value={concern}
              onChange={(e) => {
                const value = e.target.value;
                const currentCount = CharacterCount(concern);
                const newCount = CharacterCount(value);
 
                // Allow deletion anytime
                if (value.length < concern.length) {
                  setConcern(value);
                  return;
                }
 
                // Allow typing only if counted characters < max
                if (currentCount < CONCERN_MAX && newCount <= CONCERN_MAX) {
                  setConcern(value);
                }
              }}
              placeholder="Use simple, non-judgmental language"
              rows={4}
              disabled={saving}
              className={`resize-y min-h-[80px] ${errors.concern ? 'border-red-500' : ''}`}
            />
            <p className="text-xs text-gray-500">
              {CharacterCount(concern)} / {CONCERN_MAX}
            </p>
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.concern || ''}
            </p>
          </div>
 
          <div className="grid gap-2">
            <Label>Attachments (optional)</Label>
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
 
        <div className="flex justify-end gap-2 pt-2 flex-shrink-0 border-t pt-4 mt-4">
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
