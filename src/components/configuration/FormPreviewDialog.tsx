
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, Paperclip } from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'attachment' | 'rating';
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
}

interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  submissions: number;
}

interface FormPreviewDialogProps {
  form: CustomForm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FormPreviewDialog: React.FC<FormPreviewDialogProps> = ({ form, open, onOpenChange }) => {
  if (!form) return null;

  const renderField = (field: FormField) => {
    const baseProps = {
      key: field.id,
      className: "mt-1"
    };

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input id={field.id} placeholder={`Enter ${field.label.toLowerCase()}`} {...baseProps} />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea id={field.id} placeholder={`Enter ${field.label.toLowerCase()}`} rows={3} {...baseProps} />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select>
              <SelectTrigger {...baseProps}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup {...baseProps}>
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2 mt-1">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'attachment':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">
                {field.allowMultiple ? `Up to ${field.maxFiles} files` : '1 file'}
                {field.allowedFileTypes && ` (${field.allowedFileTypes.join(', ')})`}
              </p>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex space-x-1 mt-1">
              {Array.from({ length: field.maxRating || 5 }, (_, index) => (
                <Star
                  key={index}
                  className="h-6 w-6 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Form Preview
            <Badge variant={form.isActive ? "default" : "secondary"}>
              {form.isActive ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">{form.title}</h3>
            {form.description && (
              <p className="text-gray-600 mt-1">{form.description}</p>
            )}
          </div>
          
          <div className="space-y-4">
            {form.fields.map(renderField)}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button>Submit Form</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormPreviewDialog;
