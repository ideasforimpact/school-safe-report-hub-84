import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Eye, Edit } from 'lucide-react';
import { FormField, DEFAULT_GRIEVANCE_FIELDS } from '@/types/formTypes';
import { toast } from 'sonner';

interface FormBuilderProps {
  onSave: (form: any) => void;
  onCancel: () => void;
  initialForm?: any;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ onSave, onCancel, initialForm }) => {
  const [formData, setFormData] = useState({
    title: initialForm?.title || '',
    description: initialForm?.description || '',
    fields: initialForm?.fields || [...DEFAULT_GRIEVANCE_FIELDS]
  });

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'file', label: 'File Upload' },
    { value: 'captcha', label: 'Captcha' }
  ];

  const handleFieldChange = (index: number, field: Partial<FormField>) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({ ...formData, fields: updatedFields });
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const removeField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const startEditingField = (field: FormField, index: number) => {
    setEditingField({ ...field });
    setEditingIndex(index);
  };

  const saveFieldEdit = () => {
    if (editingField && editingIndex >= 0) {
      handleFieldChange(editingIndex, editingField);
      setEditingField(null);
      setEditingIndex(-1);
    }
  };

  const cancelFieldEdit = () => {
    setEditingField(null);
    setEditingIndex(-1);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Form title is required');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    onSave(formData);
  };

  const renderFieldEditor = (field: FormField, index: number) => {
    if (editingIndex !== index) {
      return (
        <div key={field.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{field.type}</Badge>
              <span className="font-medium">{field.label}</span>
              {field.required && <Badge variant="destructive">Required</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditingField(field, index)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Field Type</Label>
            <Select
              value={editingField?.type}
              onValueChange={(value) => setEditingField({ ...editingField!, type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Field ID</Label>
            <Input
              value={editingField?.id}
              onChange={(e) => setEditingField({ ...editingField!, id: e.target.value })}
              placeholder="unique_field_id"
            />
          </div>
        </div>

        <div>
          <Label>Label</Label>
          <Input
            value={editingField?.label}
            onChange={(e) => setEditingField({ ...editingField!, label: e.target.value })}
            placeholder="Field Label"
          />
        </div>

        <div>
          <Label>Placeholder</Label>
          <Input
            value={editingField?.placeholder}
            onChange={(e) => setEditingField({ ...editingField!, placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>

        {editingField?.type === 'select' && (
          <div>
            <Label>Options (one per line)</Label>
            <Textarea
              value={editingField?.options?.join('\n')}
              onChange={(e) => setEditingField({
                ...editingField!,
                options: e.target.value.split('\n').filter(opt => opt.trim())
              })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
          </div>
        )}

        {editingField?.type === 'file' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Files</Label>
              <Input
                type="number"
                value={editingField?.maxFiles}
                onChange={(e) => setEditingField({ ...editingField!, maxFiles: parseInt(e.target.value) })}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Allowed Types</Label>
              <Input
                value={editingField?.allowedFileTypes?.join(', ')}
                onChange={(e) => setEditingField({
                  ...editingField!,
                  allowedFileTypes: e.target.value.split(',').map(t => t.trim())
                })}
                placeholder="image/*, application/pdf"
              />
            </div>
          </div>
        )}

        {(editingField?.type === 'text' || editingField?.type === 'textarea') && (
          <div>
            <Label>Max Length</Label>
            <Input
              type="number"
              value={editingField?.maxLength}
              onChange={(e) => setEditingField({ ...editingField!, maxLength: parseInt(e.target.value) })}
              placeholder="200"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            checked={editingField?.required}
            onCheckedChange={(checked) => setEditingField({ ...editingField!, required: checked })}
          />
          <Label>Required field</Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveFieldEdit}>Save Field</Button>
          <Button variant="outline" onClick={cancelFieldEdit}>Cancel</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
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
          <div className="flex items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <Button onClick={addField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.fields.map((field, index) => renderFieldEditor(field, index))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Form</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}; 