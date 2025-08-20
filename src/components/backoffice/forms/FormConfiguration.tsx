import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FormField, DEFAULT_GRIEVANCE_FIELDS } from '@/types/formTypes';
import { toast } from 'sonner';

interface FormConfigurationProps {
  onSave: (form: any) => void;
  onCancel: () => void;
  initialForm?: any;
}

export const FormConfiguration: React.FC<FormConfigurationProps> = ({ onSave, onCancel, initialForm }) => {
  const [formData, setFormData] = useState({
    title: initialForm?.title || 'Grievance Form',
    description: initialForm?.description || 'Submit your grievance or complaint',
    excludedFields: initialForm?.excluded_fields || []
  });

  const handleFieldToggle = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      excludedFields: prev.excludedFields.includes(fieldId)
        ? prev.excludedFields.filter(id => id !== fieldId)
        : [...prev.excludedFields, fieldId]
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Form title is required');
      return;
    }

    // Create the form with included fields only
    const includedFields = DEFAULT_GRIEVANCE_FIELDS.filter(
      field => !formData.excludedFields.includes(field.id)
    );

    if (includedFields.length === 0) {
      toast.error('At least one field must be included');
      return;
    }

    const formConfig = {
      title: formData.title,
      description: formData.description,
      fields: includedFields,
      excluded_fields: formData.excludedFields
    };

    onSave(formConfig);
  };

  const getFieldTypeBadge = (type: string) => {
    const typeConfig = {
      text: { color: 'bg-blue-500', text: 'Text' },
      email: { color: 'bg-cyan-600', text: 'Email' },
      phone: { color: 'bg-amber-600', text: 'Phone' },
      select: { color: 'bg-purple-500', text: 'Dropdown' },
      textarea: { color: 'bg-green-500', text: 'Text Area' },
      file: { color: 'bg-orange-500', text: 'File Upload' },
      captcha: { color: 'bg-red-500', text: 'Captcha' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'bg-gray-500', text: type };

    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Form Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter form title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter form description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grievance Form Fields</CardTitle>
          <p className="text-sm text-gray-500">
            Configure which fields to include in your grievance form. Uncheck fields you want to exclude.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEFAULT_GRIEVANCE_FIELDS.map((field) => {
              const isExcluded = formData.excludedFields.includes(field.id);
              
              return (
                <div 
                  key={field.id} 
                  className={`border rounded-lg p-4 transition-all ${
                    isExcluded ? 'bg-gray-50 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{field.label}</span>
                        {getFieldTypeBadge(field.type)}
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      
                      {field.placeholder && (
                        <p className="text-sm text-gray-600 mb-2">
                          Placeholder: "{field.placeholder}"
                        </p>
                      )}
                      
                      {field.type === 'select' && field.options && (
                        <p className="text-sm text-gray-600 mb-2">
                          Options: {field.options.join(', ')}
                        </p>
                      )}
                      
                      {field.type === 'file' && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Max files: {field.maxFiles}</p>
                          <p>Allowed types: {field.allowedFileTypes?.join(', ')}</p>
                        </div>
                      )}
                      
                      {(field.type === 'text' || field.type === 'textarea') && field.maxLength && (
                        <p className="text-sm text-gray-600">
                          Max length: {field.maxLength} characters
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={!isExcluded}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <span className="text-sm font-medium">
                        {isExcluded ? 'Excluded' : 'Included'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Form Summary</h4>
            <div className="text-sm text-blue-800">
              <p>• Total fields: {DEFAULT_GRIEVANCE_FIELDS.length}</p>
              <p>• Included fields: {DEFAULT_GRIEVANCE_FIELDS.length - formData.excludedFields.length}</p>
              <p>• Excluded fields: {formData.excludedFields.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Form Configuration</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}; 