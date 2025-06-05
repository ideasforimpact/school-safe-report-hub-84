
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/types/formTypes';
import FileUpload from '@/components/FileUpload';

interface ConditionalFormRendererProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  isPreview?: boolean;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
}

const ConditionalFormRenderer: React.FC<ConditionalFormRendererProps> = ({ 
  fields, 
  onSubmit, 
  isPreview = false,
  isSubmitting = false,
  showSubmitButton = true
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    
    // Validate required fields
    const requiredFields = fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !formData[field.id] || 
      (Array.isArray(formData[field.id]) && formData[field.id].length === 0) ||
      formData[field.id] === ''
    );

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    onSubmit(formData);
  };

  // Check if field should be visible based on conditional logic
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditional) return true;
    
    const dependentValue = formData[field.conditional.dependsOn];
    return dependentValue === field.conditional.showWhen;
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const fieldValue = formData[field.id] || '';

    switch (field.type) {
      case 'text_input':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isPreview}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isPreview}
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={fieldValue} 
              onValueChange={(value) => handleInputChange(field.id, value)}
              disabled={isPreview}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.id, value)}
              disabled={isPreview}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={checkboxValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, option]
                        : checkboxValues.filter(v => v !== option);
                      handleInputChange(field.id, newValues);
                    }}
                    disabled={isPreview}
                  />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'file_upload':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <FileUpload
              onFileChange={(fileBase64) => handleInputChange(field.id, fileBase64)}
              fileType="document"
              className="w-full"
            />
          </div>
        );

      case 'star_rating':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex space-x-1">
              {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInputChange(field.id, i + 1)}
                  className={`text-2xl ${
                    i < (fieldValue || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  disabled={isPreview}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(renderField)}
      
      {showSubmitButton && (
        <Button 
          type="submit" 
          disabled={isPreview || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
      )}
    </form>
  );
};

export default ConditionalFormRenderer;
