
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface EditDialogProps {
  title: string;
  description?: string;
  isOpen?: boolean;
  onClose: () => void;
  defaultValue: string;
  onSave: (value: string) => void;
  fieldLabel?: string;
  children?: React.ReactNode;
  extraField?: {
    type: string;
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  };
  value?: string;
  onChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export const EditDialog: React.FC<EditDialogProps> = ({
  title,
  description,
  isOpen,
  onClose,
  defaultValue,
  onSave,
  fieldLabel = "Name",
  children,
  extraField,
  value: propValue,
  onChange: propOnChange,
  onOpenChange,
  triggerButton
}) => {
  const [value, setValue] = useState(propValue || defaultValue);
  const [open, setOpen] = useState(isOpen || false);

  useEffect(() => {
    if (propValue !== undefined) {
      setValue(propValue);
    } else {
      setValue(defaultValue);
    }
  }, [propValue, defaultValue, open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (!newOpen) {
      onClose();
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (propOnChange) {
      propOnChange(newValue);
    }
  };

  const handleSave = () => {
    onSave(value);
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const dialogContent = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {fieldLabel}
            </Label>
            <Input
              id="name"
              value={value}
              onChange={handleValueChange}
              className="col-span-3"
            />
          </div>
          
          {extraField && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extra-field" className="text-right">
                {extraField.label}
              </Label>
              <div className="col-span-3">
                <Select value={extraField.value} onValueChange={extraField.onChange}>
                  <SelectTrigger id="extra-field">
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
            </div>
          )}
          
          {children}
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

  return (
    <>
      {triggerButton ? (
        <div onClick={() => handleOpenChange(true)}>
          {triggerButton}
        </div>
      ) : (
        dialogContent
      )}
      {triggerButton && open && dialogContent}
    </>
  );
};
