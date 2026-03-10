
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';

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
  maxLength?: number;
}

interface EditDialogProps {
  // Fields for direct form handling
  fields?: Field[];
  initialValues?: Record<string, string>;
  onSave: ((formData: Record<string, string>) => void) | ((value: string) => void);
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
  maxLength?: number;
  // Error handling
  error?: string | null;
  isLoading?: boolean;
  // Required field indicator
  isRequired?: boolean;
  // Validation
  validationFunction?: (value: string) => boolean;
  validationMessage?: string;
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
  maxLength,
  // Error handling
  error,
  isLoading = false,
  // Required field indicator
  isRequired = false,
  // Validation
  validationFunction,
  validationMessage,
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormData(initialValues);
    }
  }, [dialogOpen]); // Removed initialValues from dependency array to prevent infinite re-renders

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
    
    // Don't submit if there's an error or loading
    if (error || isLoading) {
      return;
    }
    
    // Validate if validation function is provided
    if (validationFunction && !validationFunction(localValue)) {
      return; // Don't submit if validation fails
    }
    
    if (fields) {
      // For multi-field forms, pass the form data
      (onSave as (formData: Record<string, string>) => void)(formData);
    } else {
      // For single field dialogs, pass the local value
      (onSave as (value: string) => void)(localValue);
    }
    
    // Don't automatically close the dialog - let the parent component control this
    // setDialogOpen(false);
  };

  const handleCancel = () => {
    console.log("Edit canceled");
    // Reset form data and local value
    setFormData(initialValues);
    setLocalValue('');
    
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
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !!error}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      );
    } else {
      // Render single input with optional extra fields
      return (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Error message display at the top */}
            {error && (
              <div className="grid grid-cols-4 items-start gap-4">
                <div className="col-span-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {fieldLabel && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="field" className="text-right text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap">
                  {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
                </label>
                <div className="col-span-3">
                  <Input
                    id="field"
                    name="field"
                    value={localValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    className={`w-full ${error ? 'border-red-500' : ''} ${validationFunction && localValue && !validationFunction(localValue) ? 'border-red-500' : ''}`}
                    autoFocus
                    maxLength={maxLength}
                    required={isRequired}
                  />
                  {validationFunction && localValue && !validationFunction(localValue) && validationMessage && (
                    <p className="text-xs text-red-500 mt-1">{validationMessage}</p>
                  )}
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
                    <TextareaWithVoice
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
                      maxLength={extraField.maxLength}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !!error}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
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
