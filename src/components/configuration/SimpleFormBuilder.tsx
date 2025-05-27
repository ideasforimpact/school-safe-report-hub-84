
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, GripVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormFieldTypes } from '@/hooks/useFormFieldTypes';

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
  title: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  submissions: number;
}

interface SimpleFormBuilderProps {
  form?: CustomForm | null;
  onSave: (formData: Omit<CustomForm, 'id' | 'createdAt' | 'submissions'>) => void;
  onCancel: () => void;
}

const SimpleFormBuilder: React.FC<SimpleFormBuilderProps> = ({ form, onSave, onCancel }) => {
  const { fieldTypes, loading: fieldTypesLoading } = useFormFieldTypes();
  
  const [formData, setFormData] = useState<Omit<CustomForm, 'id' | 'createdAt' | 'submissions'>>({
    title: form?.title || '',
    description: form?.description || '',
    fields: form?.fields || [],
    isActive: form?.isActive || true,
  });

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldTypes.length > 0 ? fieldTypes[0].id : 'text_input',
      label: '',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const handleFieldChange = (fieldId: string, property: keyof FormField, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, [property]: value } : field
      )
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleOptionChange = (fieldId: string, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options?.map((opt, idx) => idx === optionIndex ? value : opt) || []
            }
          : field
      )
    }));
  };

  const handleAddOption = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      )
    }));
  };

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options?.filter((_, idx) => idx !== optionIndex) || []
            }
          : field
      )
    }));
  };

  const needsOptions = (fieldType: string) => {
    return fieldType === 'dropdown' || fieldType === 'radio_buttons' || fieldType === 'checkboxes';
  };

  const getFieldTypeName = (typeId: string) => {
    const fieldType = fieldTypes.find(ft => ft.id === typeId);
    return fieldType?.name || typeId;
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (fieldTypesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500">Loading form builder...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form ? 'Edit Form' : 'Create New Form'}</CardTitle>
          <CardDescription>
            {form ? 'Update your form details and fields' : 'Build a custom form with various field types'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter form title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter form description"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Form Fields</h3>
              <Button onClick={handleAddField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500 mb-4">No fields added yet</p>
                <Button onClick={handleAddField} variant="outline">
                  Add Your First Field
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <span className="font-medium">Field {index + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                          placeholder="Enter field label"
                        />
                      </div>
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((fieldType) => (
                              <SelectItem key={fieldType.id} value={fieldType.id}>
                                {fieldType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                        />
                        <Label>Required</Label>
                      </div>
                    </div>

                    {/* Options for dropdown, radio, and checkbox fields */}
                    {needsOptions(field.type) && (
                      <div className="mt-4">
                        <Label>Options</Label>
                        <div className="space-y-2 mt-2">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => handleOptionChange(field.id, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveOption(field.id, optionIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(field.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Rating field specific options */}
                    {field.type === 'rating' && (
                      <div className="mt-4">
                        <Label>Maximum Rating</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={field.maxRating || 5}
                          onChange={(e) => handleFieldChange(field.id, 'maxRating', parseInt(e.target.value))}
                        />
                      </div>
                    )}

                    {/* File attachment specific options */}
                    {field.type === 'file_attachment' && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.allowMultiple || false}
                            onCheckedChange={(checked) => handleFieldChange(field.id, 'allowMultiple', checked)}
                          />
                          <Label>Allow Multiple Files</Label>
                        </div>
                        {field.allowMultiple && (
                          <div>
                            <Label>Maximum Files</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={field.maxFiles || 3}
                              onChange={(e) => handleFieldChange(field.id, 'maxFiles', parseInt(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.title.trim() || formData.fields.length === 0}
            >
              {form ? 'Update Form' : 'Create Form'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleFormBuilder;
