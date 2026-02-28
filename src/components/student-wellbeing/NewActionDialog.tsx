import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { DatePicker } from '@/components/ui/date-picker';
import { Zap, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import {
  createConsultationAction,
  type StudentWellbeingRecord,
} from '@/services/student-wellbeing/studentWellbeingService';

const DESCRIPTION_MIN = 3;
const DESCRIPTION_MAX = 2000;

export interface NewActionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: StudentWellbeingRecord | null;
}

export function NewActionDialog({
  open,
  onClose,
  onSuccess,
  record,
}: NewActionDialogProps) {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  const [takenDate, setTakenDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTakenDate(new Date());
      setDescription('');
      setErrors({});
    }
  }, [open]);

  const descLen = description.trim().length;
  const descriptionValid = descLen >= DESCRIPTION_MIN && descLen <= DESCRIPTION_MAX;
  const isFormValid = !!takenDate && descriptionValid;

  const handleAddAction = async () => {
    if (!clientId || !employeeId || !record) {
      toast.error('Missing client, employee, or record context');
      return;
    }
    if (!takenDate) {
      setErrors((e) => ({ ...e, date: 'Please select date' }));
      return;
    }
    if (!descriptionValid) {
      if (descLen < DESCRIPTION_MIN) setErrors((e) => ({ ...e, description: `At least ${DESCRIPTION_MIN} characters required` }));
      else if (descLen > DESCRIPTION_MAX) setErrors((e) => ({ ...e, description: `Maximum ${DESCRIPTION_MAX} characters allowed` }));
      return;
    }

    setSaving(true);
    try {
      await createConsultationAction({
        client_id: clientId,
        employee_id: employeeId,
        student_well_begin_management_id: record.id,
        taken_date: takenDate.toISOString().slice(0, 10),
        description: description.trim(),
      });
      toast.success('Action added');
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add action');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl p-6 gap-6">
        <DialogHeader className="space-y-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5" />
            Add Action
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label className="text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              date={takenDate}
              onChange={setTakenDate}
              placeholderText="Pick a date"
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="action-desc" className="text-sm font-medium">
              Action Description <span className="text-red-500">*</span>
            </Label>
            <TextareaWithVoice
              id="action-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((e) => ({ ...e, description: '' }));
              }}
              placeholder="e.g., Parent meeting, Counseling session, Academic adjustment, Referral"
              rows={5}
              disabled={saving}
              className={`resize-y min-h-[120px] bg-muted/30 ${errors.description ? 'border-red-500' : ''}`}
              maxLength={DESCRIPTION_MAX + 100}
            />
            <p className="text-xs text-muted-foreground">
              {descLen} / {DESCRIPTION_MAX} (min {DESCRIPTION_MIN} characters)
            </p>
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
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
          <Button
            onClick={handleAddAction}
            disabled={saving || !isFormValid}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
