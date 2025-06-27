
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Field {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'color' | 'number';
}

interface SelectOption {
  value: string;
  label: string;
}

interface ExtraField {
  type: 'text' | 'select' | 'textarea' | 'color' | 'number';
  label: string;
  value: string;
  options?: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface EditDialogProps {
  // Fields for direct form handling
  fields?: Field[];
  initialValues?: Record<string, string>;
  onSave: (formData?: Record<string, string>) => void | ((value: string) => void);
  onCancel?: () => void;
  
  // Fields for controlled usage (from other components)
  title?: string;
  description?: string;
  fieldLabel?: string;
  value?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange?: (value: string) => void;
  onClose?: () => void;
  triggerButton?: React.ReactNode;
  extraFields?: ExtraField[];
}

export const EditDialog: React.FC<EditDialogProps> = ({
  // Fields for direct form handling
  fields,
  initialValues = {},
  onSave,
  onCancel,
  
  // Fields for controlled usage
  title,
  description,
  fieldLabel,
  value = '',
  open,
  onOpenChange,
  onChange,
  onClose,
  triggerButton,
  extraFields,
}) => {
  const [formData, setFormData] = React.useState<Record<string, string>>(initialValues);
  const [isOpen, setIsOpen] = React.useState(false);
  const [localValue, setLocalValue] = useState('');

  // Handle controlled vs. uncontrolled open state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = (newOpen: boolean) => {
    console.log("Dialog open state changing to:", newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  // Initialize local value when dialog opens with the provided value
  useEffect(() => {
    if (dialogOpen && value) {
      console.log("Dialog opened, initializing with value:", value);
      setLocalValue(value);
    } else if (!dialogOpen) {
      console.log("Dialog closed, resetting local value");
      setLocalValue('');
    }
  }, [dialogOpen, value]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (newValue: string) => {
    console.log("Field value changing to:", newValue);
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    
    if (fields) {
      onSave(formData);
    } else {
      // For single field dialogs, pass the local value
      if (typeof onSave === 'function') {
        (onSave as (value: string) => void)(localValue);
      }
    }
    
    setDialogOpen(false);
  };

  const handleCancel = () => {
    console.log("Edit canceled");
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
    setDialogOpen(false);
  };

  // Render different dialog content based on usage pattern
  const renderDialogContent = () => {
    if (fields) {
      // Render form fields from fields prop
      return (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <div className="grid grid-cols-4 items-center gap-4" key={field.name}>
                <label htmlFor={field.name} className="text-right text-sm font-medium col-span-1">
                  {field.label}{field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="col-span-3">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      );
    } else {
      // Render single input with optional extra fields
      return (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {fieldLabel && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="field" className="text-right text-sm font-medium col-span-1">
                  {fieldLabel}
                </label>
                <div className="col-span-3">
                  <Input
                    id="field"
                    name="field"
                    value={localValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                </div>
              </div>
            )}
            
            {extraFields && extraFields.map((extraField, index) => (
              <div className="grid grid-cols-4 items-center gap-4" key={index}>
                <label htmlFor={`extraField-${index}`} className="text-right text-sm font-medium col-span-1">
                  {extraField.label}
                </label>
                <div className="col-span-3">
                  {extraField.type === 'select' ? (
                    <Select 
                      value={extraField.value} 
                      onValueChange={extraField.onChange}
                      disabled={extraField.disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${extraField.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {extraField.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : extraField.type === 'textarea' ? (
                    <Textarea
                      id={`extraField-${index}`}
                      value={extraField.value}
                      onChange={(e) => extraField.onChange(e.target.value)}
                      className="w-full"
                      disabled={extraField.disabled}
                    />
                  ) : (
                    <Input
                      id={`extraField-${index}`}
                      type={extraField.type === 'color' ? 'color' : extraField.type === 'number' ? 'number' : 'text'}
                      value={extraField.value}
                      onChange={(e) => extraField.onChange(e.target.value)}
                      className="w-full"
                      disabled={extraField.disabled}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      );
    }
  };

  // For controlled component usage with external trigger
  if (triggerButton) {
    return (
      <>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {React.cloneElement(triggerButton as React.ReactElement, {
            onClick: () => setDialogOpen(true)
          })}
          <DialogContent>
            {title && (
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
              </DialogHeader>
            )}
            {renderDialogContent()}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // For directly controlled dialog
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
};
