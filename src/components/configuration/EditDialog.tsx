
import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/components/ui/sonner';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface ExtraFieldOption {
  value: string;
  label: string;
}

interface ExtraFieldProps {
  type: "select";
  label: string;
  options: ExtraFieldOption[];
  value: string;
  onChange: (value: string) => void;
}

interface EditDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  value: string;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  triggerButton: React.ReactNode;
  extraField?: ExtraFieldProps;
}

interface FormValues {
  name: string;
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
  extraField,
}: EditDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalValue(value);
    }
  }, [isOpen, value]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalValue(value);
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    if (!localValue || localValue.trim() === '') {
      toast.error("Please enter a valid name");
      return;
    }
    
    try {
      onChange(localValue);
      onSave();
      toast.success("Successfully saved");
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    }
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          
          {extraField && extraField.type === "select" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="extraField" className="text-sm font-medium col-span-1">
                {extraField.label}
              </label>
              <div className="col-span-3">
                <Select 
                  value={extraField.value} 
                  onValueChange={extraField.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${extraField.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {extraField.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
