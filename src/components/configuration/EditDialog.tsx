
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface EditDialogProps {
  title: string;
  description?: string;
  fieldLabel: string;
  value: string;
  defaultValue?: string;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose?: () => void;
  triggerButton: React.ReactNode;
  extraField?: {
    type: string;
    label: string;
    options?: { value: string; label: string }[];
    value: any;
    onChange: (value: string) => void;
  };
}

export const EditDialog: React.FC<EditDialogProps> = ({
  title,
  description,
  fieldLabel,
  value,
  defaultValue = '',
  open,
  onOpenChange,
  onChange,
  onSave,
  onClose,
  triggerButton,
  extraField,
}) => {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium col-span-1">
              {fieldLabel}
            </label>
            <Input
              id="name"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          {extraField && extraField.type === 'select' && extraField.options && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                {extraField.label}
              </label>
              <div className="col-span-3">
                <Select
                  value={extraField.value}
                  onValueChange={extraField.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${extraField.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {extraField.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {extraField && extraField.type === 'text' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm font-medium col-span-1 pt-2">
                {extraField.label}
              </label>
              <Textarea
                value={extraField.value}
                onChange={(e) => extraField.onChange(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
