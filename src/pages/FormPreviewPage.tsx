
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, Paperclip, ArrowLeft } from 'lucide-react';
import { useCustomForms } from '@/hooks/useCustomForms';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FormField {
  id: string;
  type: string;
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
  client_id: string;
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const FormPreviewPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { forms, loading } = useCustomForms();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formId && forms.length > 0) {
      const foundForm = forms.find(f => f.id === formId);
      setForm(foundForm || null);
    }
  }, [formId, forms]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    setSubmitting(true);

    try {
      // Prepare responses array based on form values with label included
      const responses = form.fields.map(field => ({
        type: field.type,
        label: field.label,
        value: formValues[field.id] || ''
      }));

      console.log('Submitting form:', { form_id: form.id, responses });

      // Call the submit-form edge function
      const { data, error } = await supabase.functions.invoke('submit-form', {
        body: {
          form_id: form.id,
          responses: responses,
          submitter_name: formValues['submitter_name'] || null,
          submitter_email: formValues['submitter_email'] || null,
          comments: formValues['comments'] || null
        }
      });

      if (error) {
        console.error('Error submitting form:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit form');
      }

      toast({
        title: "Success",
        description: "Form submitted successfully!"
      });

      // Redirect to forms page after successful submission
      navigate('/forms');
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseProps = {
      key: field.id,
      className: "mt-1"
    };

    switch (field.type) {
      case 'text_input':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input 
              id={field.id} 
              placeholder={`Enter ${field.label.toLowerCase()}`} 
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              disabled={submitting}
              {...baseProps} 
            />
          </div>
        );

      case 'text_area':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea 
              id={field.id} 
              placeholder={`Enter ${field.label.toLowerCase()}`} 
              rows={3} 
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              disabled={submitting}
              {...baseProps} 
            />
          </div>
        );

      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select 
              value={formValues[field.id] || ''} 
              onValueChange={(value) => handleFieldChange(field.id, value)}
              disabled={submitting}
            >
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

      case 'radio_buttons':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              value={formValues[field.id] || ''} 
              onValueChange={(value) => handleFieldChange(field.id, value)}
              disabled={submitting}
              {...baseProps}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkboxes':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2 mt-1">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${field.id}-${index}`}
                    checked={(formValues[field.id] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = formValues[field.id] || [];
                      if (checked) {
                        handleFieldChange(field.id, [...currentValues, option]);
                      } else {
                        handleFieldChange(field.id, currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={submitting}
                  />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'file_attachment':
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
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    (formValues[field.id] || 0) > index 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-400'
                  } ${submitting ? 'pointer-events-none' : ''}`}
                  onClick={() => !submitting && handleFieldChange(field.id, index + 1)}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
          <p className="text-gray-600 mb-6">The form you're looking for could not be found.</p>
          <Button onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="gap-2"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold">{form?.title}</h1>
              <Badge variant={form?.is_active ? "default" : "secondary"}>
                {form?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {form?.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>
          
          <div className="space-y-6">
            {form?.fields.map(renderField)}
          </div>
          
          <div className="flex justify-end pt-8 border-t mt-8">
            <Button 
              type="submit" 
              size="lg" 
              disabled={submitting || !form?.is_active}
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormPreviewPage;
