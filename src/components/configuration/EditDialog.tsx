
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  triggerButton: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function EditDialog({ 
  title, 
  description, 
  fieldLabel, 
  value, 
  onChange, 
  onSave,
  triggerButton,
  onOpenChange
}: EditDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder={fieldLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="my-4"
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={onSave}>Save Changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
