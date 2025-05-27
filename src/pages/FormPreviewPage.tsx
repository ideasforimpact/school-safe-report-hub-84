
import React from 'react';
import { useParams } from 'react-router-dom';
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

const FormPreviewPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();

  // Mock data for demo - in real app, this would come from an API or context
  const mockForms: CustomForm[] = [
    {
      id: '1',
      title: 'Student Feedback Form',
      description: 'Collect feedback from students about their learning experience',
      fields: [
        { id: '1', type: 'text', label: 'Student Name', required: true },
        { id: '2', type: 'select', label: 'Grade', required: true, options: ['9th', '10th', '11th', '12th'] },
        { id: '3', type: 'textarea', label: 'Feedback', required: true },
        { id: '4', type: 'rating', label: 'Overall Satisfaction', required: true, maxRating: 5 },
        { id: '5', type: 'attachment', label: 'Supporting Documents', required: false, allowMultiple: true, maxFiles: 3, allowedFileTypes: ['image/*', 'application/pdf'] }
      ],
      isActive: true,
      createdAt: '2024-01-15',
      submissions: 23
    },
    {
      id: '2',
      title: 'Teacher Evaluation',
      description: 'Annual teacher performance evaluation form',
      fields: [
        { id: '1', type: 'text', label: 'Teacher Name', required: true },
        { id: '2', type: 'radio', label: 'Performance Rating', required: true, options: ['Excellent', 'Good', 'Average', 'Needs Improvement'] },
        { id: '3', type: 'rating', label: 'Teaching Effectiveness', required: true, maxRating: 10 }
      ],
      isActive: false,
      createdAt: '2024-01-10',
      submissions: 8
    }
  ];

  const form = mockForms.find(f => f.id === formId);

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold">{form.title}</h1>
              <Badge variant={form.isActive ? "default" : "secondary"}>
                {form.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>
          
          <div className="space-y-6">
            {form.fields.map(renderField)}
          </div>
          
          <div className="flex justify-end pt-8 border-t mt-8">
            <Button size="lg">Submit Form</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreviewPage;
