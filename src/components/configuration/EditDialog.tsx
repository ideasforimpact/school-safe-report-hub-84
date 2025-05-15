
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Field {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'color' | 'number';
}

interface EditDialogProps {
  onSave: (formData: Record<string, string>) => void;
  onCancel: () => void;
  fields: Field[];
  initialValues: Record<string, string>;
}

export const EditDialog: React.FC<EditDialogProps> = ({
  onSave,
  onCancel,
  fields,
  initialValues,
}) => {
  const [formData, setFormData] = React.useState<Record<string, string>>(initialValues);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        {fields.map((field) => (
          <div className="grid grid-cols-4 items-center gap-4" key={field.name}>
            <label htmlFor={field.name} className="text-right text-sm font-medium col-span-1">
              {field.label}{field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="col-span-3">
              <Input
                id={field.name}
                name={field.name}
                type={field.type || 'text'}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full"
              />
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
};
