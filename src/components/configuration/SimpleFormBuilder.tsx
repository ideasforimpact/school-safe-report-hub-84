
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setDescription(form.description);
      setIsActive(form.isActive);
      setFields(form.fields);
    }
  }, [form]);

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      required: false
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(fields.find(f => f.id === fieldId)?.options || []), '']
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title: title.trim(),
      description: description.trim(),
      fields,
      isActive
    });
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'textarea': return '📄';
      case 'select': return '📋';
      case 'radio': return '🔘';
      case 'checkbox': return '☑️';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Button>
        <div>
          <h3 className="text-lg font-medium">
            {form ? 'Edit Form' : 'Create New Form'}
          </h3>
          <p className="text-sm text-gray-500">
            Build your custom form by adding fields and configuring their properties
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter form description"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Field</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={addField} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Fields ({fields.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields added yet. Click "Add Field" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <GripVertical className="h-4 w-4" />
                            <span className="text-lg">{getFieldIcon(field.type)}</span>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                                <Input
                                  id={`label-${field.id}`}
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  placeholder="Enter field label"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`type-${field.id}`}>Field Type</Label>
                                <Select
                                  value={field.type}
                                  onValueChange={(value) => updateField(field.id, { 
                                    type: value as FormField['type'],
                                    options: ['select', 'radio', 'checkbox'].includes(value) ? [''] : undefined
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="radio">Radio Buttons</SelectItem>
                                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                />
                                <Label>Required</Label>
                              </div>
                              
                              <Badge variant="secondary">
                                Field {index + 1}
                              </Badge>
                            </div>
                            
                            {/* Options for select, radio, checkbox */}
                            {(['select', 'radio', 'checkbox'].includes(field.type)) && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Options</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(field.id)}
                                    className="gap-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Option
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {field.options?.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex gap-2">
                                      <Input
                                        value={option}
                                        onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeOption(field.id, optionIndex)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeField(field.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()}>
          {form ? 'Update Form' : 'Create Form'}
        </Button>
      </div>
    </div>
  );
};

export default SimpleFormBuilder;
