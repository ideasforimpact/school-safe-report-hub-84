
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EditDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  value: string;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  triggerButton: React.ReactNode;
}

export const EditDialog = ({
  title,
  description,
  fieldLabel,
  value,
  onOpenChange,
  onChange,
  onSave,
  triggerButton,
}: EditDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalValue(value);
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    onChange(localValue);
    onSave();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-sm font-medium col-span-1">
              {fieldLabel}
            </label>
            <Input
              id="name"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
