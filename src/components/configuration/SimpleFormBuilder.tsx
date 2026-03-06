import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Switch } from '@/components/ui/switch';
import { Plus, X, GripVertical, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormFieldTypes } from '@/hooks/useFormFieldTypes';
import ConditionalLogicSection from './ConditionalLogicSection';
import { FormField, CustomForm } from '@/types/formTypes';
import { toast } from '@/hooks/use-toast';

interface SimpleFormBuilderProps {
  form?: CustomForm | null;
  onSave: (formData: Omit<CustomForm, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const SimpleFormBuilder: React.FC<SimpleFormBuilderProps> = ({ form, onSave, onCancel }) => {
  const { fieldTypes, loading: fieldTypesLoading } = useFormFieldTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Omit<CustomForm, 'id' | 'created_at' | 'updated_at'>>({
    client_id: form?.client_id || '',
    title: form?.title || '',
    description: form?.description || '',
    fields: form?.fields || [],
    is_active: form?.is_active || true,
    created_by: form?.created_by || null,
  });

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldTypes.length > 0 ? fieldTypes[0].key : 'text_input',
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

  function handleOptionChange(fieldId: string, optionIndex: number, value: string) {
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
  }

  function handleAddOption(fieldId: string) {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      )
    }));
  }

  function handleRemoveOption(fieldId: string, optionIndex: number) {
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
  }

  function needsOptions(fieldType: string) {
    return fieldType === 'dropdown' || fieldType === 'radio_buttons' || fieldType === 'checkboxes';
  }

  function getFieldTypeName(typeKey: string) {
    const fieldType = fieldTypes.find(ft => ft.key === typeKey);
    return fieldType?.name || typeKey;
  }

  async function handleSave() {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      
      toast({
        title: "Success",
        description: form ? "Form updated successfully!" : "Form created successfully!",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error saving form:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (fieldTypesLoading || isSubmitting) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {fieldTypesLoading ? 'Loading form builder...' : 'Saving form...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form ? 'Edit Form' : 'Create New Form'}</CardTitle>
          <CardDescription>
            {form ? 'Update your form details and fields' : 'Build a custom form with various field types and conditional logic'}
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
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <TextareaWithVoice
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter form description"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                disabled={isSubmitting}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Form Fields</h3>
              <Button 
                onClick={handleAddField} 
                size="sm"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500 mb-4">No fields added yet</p>
                <Button 
                  onClick={handleAddField} 
                  variant="outline"
                  disabled={isSubmitting}
                >
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
                        disabled={isSubmitting}
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
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((fieldType) => (
                              <SelectItem key={fieldType.id} value={fieldType.key}>
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
                          disabled={isSubmitting}
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
                                disabled={isSubmitting}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveOption(field.id, optionIndex)}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(field.id)}
                            disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conditional Logic Section */}
                    <ConditionalLogicSection
                      field={field}
                      allFields={formData.fields}
                      onUpdateField={handleFieldChange}
                      fieldIndex={index}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.title.trim() || formData.fields.length === 0 || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {form ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                form ? 'Update Form' : 'Create Form'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleFormBuilder;
