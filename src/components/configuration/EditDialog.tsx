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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface ExtraField {
  type: "select" | "input";
  label: string;
  options?: { value: string; label: string; }[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface EditDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  value: string;
  extraFields?: ExtraField[]; // Change from extraField to extraFields array
  onOpenChange?: (open: boolean) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  triggerButton: React.ReactNode;
}

export const EditDialog = ({ 
  title, 
  description, 
  fieldLabel, 
  value, 
  extraFields = [], // Change from extraField to extraFields with default empty array
  onOpenChange,
  onChange, 
  onSave,
  triggerButton 
}: EditDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const handleSave = () => {
    onSave();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="main-field">{fieldLabel}</Label>
            <Input
              id="main-field"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            />
          </div>
          
          {/* Render multiple extra fields */}
          {extraFields.map((field, index) => (
            <div key={index}>
              <Label htmlFor={`extra-field-${index}`}>{field.label}</Label>
              {field.type === "select" ? (
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                  disabled={field.disabled}
                >
                  <SelectTrigger id={`extra-field-${index}`}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )) || (
                      <SelectItem value="no-options" disabled>No options available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`extra-field-${index}`}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  disabled={field.disabled}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
