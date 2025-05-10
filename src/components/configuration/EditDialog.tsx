
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface ExtraField {
  type: "select";
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

interface EditDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  value: string;
  extraField?: ExtraField;
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
  extraField,
  onOpenChange,
  onChange,
  onSave,
  triggerButton,
}: EditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  // Update the internal state when the external value changes or when dialog opens
  useEffect(() => {
    setCurrentValue(value);
  }, [value, open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);
    
    // Reset to initial value when opened
    if (newOpen) {
      setCurrentValue(value);
    }
  };

  const handleSave = () => {
    onChange(currentValue); // Make sure the parent component has the current value
    onSave();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div onClick={() => setOpen(true)}>{triggerButton}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{fieldLabel}</Label>
            <Input
              id="name"
              value={currentValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setCurrentValue(newValue);
                onChange(newValue);
              }}
              className="col-span-3"
            />
          </div>
          
          {extraField && extraField.type === "select" && (
            <div className="grid gap-2">
              <Label htmlFor="extraField">{extraField.label}</Label>
              <Select 
                value={extraField.value} 
                onValueChange={extraField.onChange}
              >
                <SelectTrigger id="extraField">
                  <SelectValue placeholder={`Select ${extraField.label}`} />
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
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={!currentValue.trim()}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
