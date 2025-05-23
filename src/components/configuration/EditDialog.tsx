
import React from 'react';
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
  onChange: (value: string) => void;
}

interface EditDialogProps {
  // Fields for direct form handling
  fields?: Field[];
  initialValues?: Record<string, string>;
  onSave: (formData: Record<string, string>) => void;
  onCancel?: () => void;
  
  // Fields for controlled usage (from other components)
  title?: string;
  description?: string;
  fieldLabel?: string;
  value?: string;
  defaultValue?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange?: (value: string) => void;
  onClose?: () => void;
  triggerButton?: React.ReactNode;
  extraField?: ExtraField;
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
  defaultValue = '',
  open,
  onOpenChange,
  onChange,
  onClose,
  triggerButton,
  extraField,
}) => {
  const [formData, setFormData] = React.useState<Record<string, string>>(initialValues);
  const [isOpen, setIsOpen] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value || defaultValue || '');

  // Handle controlled vs. uncontrolled open state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (!dialogOpen) {
      // Reset state when dialog closes
      setLocalValue(defaultValue || '');
    }
  }, [dialogOpen, defaultValue]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (value: string) => {
    setLocalValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fields) {
      // For direct form handling
      onSave(formData);
    } else {
      // For controlled usage
      onSave({});
    }
    
    setDialogOpen(false);
  };

  const handleCancel = () => {
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
      // Render single input with optional extra field
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
                  />
                </div>
              </div>
            )}
            
            {extraField && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="extraField" className="text-right text-sm font-medium col-span-1">
                  {extraField.label}
                </label>
                <div className="col-span-3">
                  {extraField.type === 'select' ? (
                    <Select value={extraField.value} onValueChange={extraField.onChange}>
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
                      id="extraField"
                      value={extraField.value}
                      onChange={(e) => extraField.onChange(e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      id="extraField"
                      type={extraField.type === 'color' ? 'color' : extraField.type === 'number' ? 'number' : 'text'}
                      value={extraField.value}
                      onChange={(e) => extraField.onChange(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            )}
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

  // For directly rendered component
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        {fields?.map((field) => (
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
};
