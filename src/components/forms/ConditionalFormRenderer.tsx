
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/types/formTypes';

interface ConditionalFormRendererProps {
  fields: FormField[];
  onSubmit?: (data: Record<string, any>) => void;
  isPreview?: boolean;
  isSubmitting?: boolean;
}

const ConditionalFormRenderer: React.FC<ConditionalFormRendererProps> = ({
  fields,
  onSubmit,
  isPreview = false,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Calculate which fields should be visible based on conditional logic
  useEffect(() => {
    const newVisibleFields = new Set<string>();

    fields.forEach(field => {
      if (!field.conditional) {
        // Field has no conditions, always visible
        newVisibleFields.add(field.id);
      } else {
        // Field has conditions, check if they're met
        const dependencyValue = formData[field.conditional.dependsOn];
        if (dependencyValue === field.conditional.showWhen) {
          newVisibleFields.add(field.id);
        }
      }
    });

    setVisibleFields(newVisibleFields);
  }, [fields, formData]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isSubmitting) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.id)) {
      return null;
    }

    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text_input':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'text_area':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.id, val)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
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

      case 'radio_buttons':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleFieldChange(field.id, val)}
              disabled={isSubmitting}
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

      case 'checkboxes':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = value || [];
                      if (checked) {
                        handleFieldChange(field.id, [...currentValues, option]);
                      } else {
                        handleFieldChange(field.id, currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex space-x-1">
              {Array.from({ length: field.maxRating || 5 }, (_, i) => i + 1).map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant={value === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFieldChange(field.id, rating)}
                  disabled={isSubmitting}
                >
                  {rating}
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitting}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(renderField)}
      
      {!isPreview && (
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Form"}
        </Button>
      )}
      
      {isPreview && (
        <div className="text-sm text-gray-500 italic">
          This is a preview. Form submission is disabled.
        </div>
      )}
    </form>
  );
};

export default ConditionalFormRenderer;
