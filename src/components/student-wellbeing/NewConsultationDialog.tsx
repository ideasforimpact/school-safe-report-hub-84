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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Users, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createStudentConsultation,
  type StudentWellbeingRecord,
  type ConsultationType,
} from '@/services/student-wellbeing/studentWellbeingService';

const NOTES_MAX = 2000;

const CONSULTATION_TYPES: { value: ConsultationType; label: string }[] = [
  { value: 'School Counselor', label: 'School Counselor' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'External Professional', label: 'External Professional' },
];

export interface NewConsultationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: StudentWellbeingRecord | null;
}

export function NewConsultationDialog({
  open,
  onClose,
  onSuccess,
  record,
}: NewConsultationDialogProps) {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [consultationDate, setConsultationDate] = useState<Date | undefined>(new Date());
  const [modeId, setModeId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [modeOptions, setModeOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Control future date selection from here
  const allowFutureDate = false; 
  const getConsultationCharacterCount = (text: string) => {
    const trimmed = text.trim();
    const matches = trimmed.match(/[^\s]/g); 
    return matches ? matches.length : 0;
  };
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOptions(true);
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from('consultation_mode')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (cancelled) return;
      setLoadingOptions(false);
      if (error) {
        toast.error('Failed to load consultation modes');
        return;
      }
      const list: { id: string; name: string }[] = Array.isArray(data) ? data : [];
      setModeOptions(list);
      if (list.length > 0) {
        const inPerson = list.find((r) => r.name === 'In-person');
        setModeId(inPerson?.id ?? list[0].id);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (open) {
      setConsultationType(null);
      setConsultationDate(new Date());
      setNotes('');
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!consultationType) next.consultationType = 'Please select who provided the consultation';
    if (!consultationDate) next.date = 'Please select date';
    if (!modeId) next.mode = 'Please select mode';
    const notesLen = getConsultationCharacterCount(notes);
    if (notesLen > NOTES_MAX) next.notes = `Maximum ${NOTES_MAX} characters allowed`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isFormValid =
    !!consultationType &&
    !!consultationDate &&
    !!modeId &&
    getConsultationCharacterCount(notes) <= NOTES_MAX

  const handleAddConsultation = async () => {
    if (!clientId || !employeeId || !record) {
      toast.error('Missing client, employee, or record context');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      await createStudentConsultation({
        client_id: clientId,
        employee_id: employeeId,
        student_well_begin_management_id: record.id,
        consultation_provided_by: consultationType!,
        consultation_date: consultationDate!.toISOString().slice(0, 10),
        mode_id: modeId,
        support_notes: notes.trim() || null,
      });

      toast.success('Consultation was added successfully');
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add consultation');
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
      <DialogContent className="sm:max-w-xl p-6 gap-6">
        <DialogHeader className="space-y-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5" />
            New Consultation
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          {/* Consultation provided by - pill style with round tick and green when selected */}
          <div className="grid gap-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Consultation provided by <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {CONSULTATION_TYPES.map((opt) => {
                const selected = consultationType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConsultationType(opt.value)}
                    disabled={saving}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                      selected
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-input bg-muted/30 hover:bg-muted/50 text-foreground'
                    )}
                  >
                    {selected ? (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-600">
                        <Check className="h-2.5 w-2.5 stroke-[2.5] text-white" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className="font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.consultationType && (
              <p className="text-sm text-red-500">{errors.consultationType}</p>
            )}
          </div>

          {/* Consultation Date and Mode side by side */}
          <div className="grid grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Consultation Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={consultationDate}
                onChange={setConsultationDate}
                disableFuture={!allowFutureDate}
                placeholderText="select date"
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
            <div className="grid gap-3">
              <Label className="text-sm font-medium">Mode <span className="text-red-500">*</span></Label>
              <Select
                value={modeId}
                onValueChange={setModeId}
                disabled={saving || loadingOptions}
              >
                <SelectTrigger className={errors.mode ? 'border-red-500' : 'bg-muted/30'}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {modeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mode && (
                <p className="text-sm text-red-500">{errors.mode}</p>
              )}
            </div>
          </div>

          {/* Support / Consultation Notes - optional, min 1 max 2000 when provided */}
          <div className="grid gap-3">
            <Label htmlFor="notes" className="text-sm font-medium">
              Support / Consultation Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                const value = e.target.value;

                const currentCount = getConsultationCharacterCount(notes);
                const newCount = getConsultationCharacterCount(value);

                // allow deletion anytime
                if (value.length < notes.length) {
                  setNotes(value);
                  return;
                }

                if (currentCount < NOTES_MAX && newCount <= NOTES_MAX) {
                  setNotes(value);
                }
              }}
              placeholder="Enter consultation notes..."
              rows={5}
              disabled={saving}
              className={cn('resize-y min-h-[120px] bg-muted/30', errors.notes ? 'border-red-500' : '')}
            />
            <p className="text-xs text-muted-foreground">
              {getConsultationCharacterCount(notes)} / {NOTES_MAX}. 
              No medical terms, plain text only. Max {NOTES_MAX} characters.
            </p>
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes}</p>
            )}
          </div>
        </div>

        {saving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleAddConsultation} disabled={saving || !isFormValid}>
            Add Consultation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
