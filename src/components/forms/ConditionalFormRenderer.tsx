
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
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

    fields.forEach((field: any) => {
      // No conditional logic configured; always show
      newVisibleFields.add(field.id);
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

  const renderField = (field: any) => {
    if (!visibleFields.has(field.id)) {
      return null;
    }

    const value = formData[field.id] || '';

    // Normalize legacy field types based on label keywords
    const labelText = (field.label || field.field_label || '').toString().toLowerCase();
    const idText = (field.id || '').toString().toLowerCase();
    const normalizedType = (() => {
      const isEmailLabel = /email/.test(labelText) || idText.includes('email');
      const isPhoneLabel = /(phone|mobile)/.test(labelText) || idText.includes('phone') || idText.includes('mobile');
      if ((field.type === 'text' || field.type === 'text_input') && isEmailLabel) return 'email';
      if ((field.type === 'text' || field.type === 'text_input') && isPhoneLabel) return 'phone';
      return field.type;
    })();

    switch (normalizedType) {
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder={field.placeholder}
              value={value}
              onKeyDown={(e) => {
                const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
                if (allowed.includes(e.key)) return;
                if (!/^[0-9]$/.test(e.key) || String(value).length >= 10) {
                  e.preventDefault();
                }
              }}
              onBeforeInput={(e: any) => {
                const data = e?.nativeEvent?.data as string | null;
                if (data && !/^\d$/.test(data)) {
                  e.preventDefault();
                }
                const target = e.currentTarget as HTMLInputElement;
                if (target?.value?.length >= 10) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                if (!/^\d+$/.test(text)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                if (e.target.value !== onlyDigits) {
                  e.target.value = onlyDigits;
                }
                handleFieldChange(field.id, onlyDigits);
              }}
              required={field.required}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'text_input':
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <TextareaWithVoice
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        );

      case 'select':
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
                {field.options?.map((option: string) => (
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
