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
import { FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  updateStudentWellbeingRecord,
  type StudentWellbeingRecord,
} from '@/services/student-wellbeing/studentWellbeingService';
import { useClientIntegrationEnabled } from '@/hooks/useClientIntegrationEnabled';
//  Control future date selection from here
const allowFutureDate = false;
const CONCERN_MIN = 5;
const CONCERN_MAX = 2000;
const CONCERN_NO_SPECIAL = /^[a-zA-Z0-9\s.,?!'\-_\n\r]*$/;
const ATTACHMENTS_MAX_FILES = 5;
const ATTACHMENTS_MAX_SIZE_MB = 10;
const ATTACHMENTS_MAX_TOTAL_MB = ATTACHMENTS_MAX_FILES * ATTACHMENTS_MAX_SIZE_MB;
const CharacterCount = (text: string) => {
  const trimmed = text.trim();
  const matches = trimmed.match(/[^\s]/g);
  return matches ? matches.length : 0;
};
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'under_observation', label: 'Under Observation' },
  { value: 'closed', label: 'Closed' },
] as const;
 
export interface EditWellBeingRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: StudentWellbeingRecord | null;
}
 
export function EditWellBeingRecordDialog({
  open,
  onClose,
  onSuccess,
  record,
}: EditWellBeingRecordDialogProps) {
  const { employeeData } = useAuth();
  const { isIntegrationEnabled } = useClientIntegrationEnabled();
  const clientId = employeeData?.clientId;
 
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [typeOfConcernId, setTypeOfConcernId] = useState<string>('');
  const [dateOfObservation, setDateOfObservation] = useState<Date | undefined>(undefined);
  const [concern, setConcern] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [nextFollowUp, setNextFollowUp] = useState<Date | undefined>(undefined);
  const [existingKept, setExistingKept] = useState<{ path: string; name: string }[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [generalConcernOptions, setGeneralConcernOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
 
  useEffect(() => {
    if (!open) return;
    if (record) {
      if (record.is_external_student) {
        const external = record.external_student_involved;
        setStudent({
          id: external?.student?.id ?? '',
          student_id: external?.student?.id ?? undefined,
          name: external?.student?.name ?? record.student_name,
          section_id: external?.section?.id ?? undefined,
          grade_id: external?.grade?.id ?? undefined,
          section_name: external?.section?.name ?? undefined,
          grade_name: external?.grade?.name ?? undefined,
          is_external: true,
        });
      } else {
        setStudent({
          id: record.student_id ?? '',
          student_id: record.student_display_id ?? undefined,
          name: record.student_name,
          section_id: record.section_id ?? undefined,
          grade_id: record.grade_id ?? undefined,
          is_external: false,
        });
      }
      setTypeOfConcernId(record.type_of_concern_id ?? '');
      setDateOfObservation(
        record.date_of_observation
          ? new Date(record.date_of_observation)
          : undefined
      );
      setConcern(record.concern_notes ?? '');
      setStatus(record.status ?? 'open');
      setNextFollowUp(
        record.next_follow_up ? new Date(record.next_follow_up) : undefined
      );
      const docs = record.document_url ?? [];
      setExistingKept(Array.isArray(docs) ? docs.map((d) => ({ path: d.path, name: d.name })) : []);
      setAttachmentFiles([]);
    }
  }, [open, record]);
 
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
      if (list.length > 0 && record && !record.type_of_concern_id) {
        const general = list.find((r) => r.name === 'General Concern');
        setTypeOfConcernId(general?.id ?? list[0].id);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, record]);
 
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!student) next.student = 'Please select a student';
    if (!typeOfConcernId) next.typeOfConcern = 'Please select type of concern';
    if (!dateOfObservation) next.date = 'Please select date of observation';
    const len = CharacterCount(concern);

    // ✅ CHECK SPECIAL CHARACTERS FIRST
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
 
  const handleSave = async () => {
    if (!clientId || !record) {
      toast.error('Missing client or record');
      return;
    }
    if (!validate()) return;
 
    setSaving(true);
    try {
      const attachmentsPayload = attachmentFiles.map((f) => ({
        name: f.name,
        type: f.type,
        base64: (f.base64 ?? '').replace(/^data:[^;]+;base64,/, ''),
      }));
      const isExternalStudent = isIntegrationEnabled && student?.is_external === true;
      
      const externalStudentInvolved = isExternalStudent
        ? {
            student: {
              id: student?.id ?? null,
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
        
      await updateStudentWellbeingRecord({
        id: record.id,
        client_id: clientId,
        employee_id: employeeData?.id ?? '',
        student_id: isExternalStudent ? null : student!.id,
        section_id: isExternalStudent ? null : (student!.section_id ?? null),
        grade_id: isExternalStudent ? null : (student!.grade_id ?? null),
        student_name: student!.name ?? null,
        section_name: student!.section_name ?? null,
        grade_name: student!.grade_name ?? null,
        is_external_student: isExternalStudent,
        external_student_involved: externalStudentInvolved,
        type_of_concern_id: typeOfConcernId,
        date_of_observation: dateOfObservation!.toLocaleDateString('en-CA'),
        concern: concern.trim() || null,
        status: status as 'open' | 'under_observation' | 'closed',
        next_follow_up: nextFollowUp
        ? nextFollowUp.toLocaleDateString('en-CA')
        : null,
        document_url: existingKept,
        attachments: attachmentsPayload,
      });
 
      toast.success('Record was updated successfully');
      setErrors({});
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };
 
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };
 
  if (!record) return null;
 
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-y-auto no-scrollbar"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()} >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Well-Being Record</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow grid gap-4 py-4 pr-2 ">
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
              {CharacterCount(concern)} / {CONCERN_MAX} (min {CONCERN_MIN}, no special characters)
            </p>
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.concern || ''}
            </p>
          </div>
 
          <div className="grid gap-2">
            <Label>Attachments (optional)</Label>
            {existingKept.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-muted-foreground">Existing attachments</p>
                <ul className="space-y-1.5">
                  {existingKept.map((doc, i) => (
                    <li
                      key={`${doc.path}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 truncate min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        {doc.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExistingKept((prev) => prev.filter((_, idx) => idx !== i))}
                        disabled={saving}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        aria-label="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ReusableFileUploader
              onFilesChange={setAttachmentFiles}
              initialFiles={[]}
              maxFiles={ATTACHMENTS_MAX_FILES}
              maxSize={ATTACHMENTS_MAX_SIZE_MB}
              maxTotalSize={ATTACHMENTS_MAX_TOTAL_MB}
              showFileList={true}
              disabled={saving}
            />
          </div>
 
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          {/* Next Follow-up field commented out - value is derived from follow_up_entries
          <div className="grid gap-2">
            <Label>Next Follow-up</Label>
            <DatePicker
              date={nextFollowUp}
              onChange={setNextFollowUp}
              placeholderText="Select date (optional)"
            />
          </div>
          */}
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
          <Button onClick={handleSave} disabled={saving}>
            Update Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
