
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { FormField } from '@/types/formTypes';

interface ConditionalLogicSectionProps {
  field: FormField;
  allFields: FormField[];
  onUpdateField: (fieldId: string, property: keyof FormField, value: any) => void;
  fieldIndex: number;
}

const ConditionalLogicSection: React.FC<ConditionalLogicSectionProps> = ({
  field,
  allFields,
  onUpdateField,
  fieldIndex
}) => {
  // Get fields that can be used as dependencies (only fields before this one)
  const availableDependencies = allFields.slice(0, fieldIndex).filter(f => 
    f.type === 'dropdown' || f.type === 'radio_buttons' || f.type === 'checkboxes'
  );

  const selectedDependency = field.conditional?.dependsOn 
    ? allFields.find(f => f.id === field.conditional.dependsOn)
    : null;

  const handleToggleConditional = (enabled: boolean) => {
    if (enabled && availableDependencies.length > 0) {
      onUpdateField(field.id, 'conditional', {
        dependsOn: availableDependencies[0].id,
        showWhen: availableDependencies[0].options?.[0] || ''
      });
    } else {
      onUpdateField(field.id, 'conditional', undefined);
    }
  };

  const handleDependencyChange = (dependsOn: string) => {
    const dependency = allFields.find(f => f.id === dependsOn);
    onUpdateField(field.id, 'conditional', {
      dependsOn,
      showWhen: dependency?.options?.[0] || ''
    });
  };

  const handleShowWhenChange = (showWhen: string) => {
    onUpdateField(field.id, 'conditional', {
      ...field.conditional!,
      showWhen
    });
  };

  if (availableDependencies.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Conditional logic requires at least one dropdown, radio button, or checkbox field above this field.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 border rounded-md bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium">Conditional Logic</Label>
        <div className="flex items-center space-x-2">
          <Switch
            checked={!!field.conditional}
            onCheckedChange={handleToggleConditional}
          />
          <Label className="text-sm">Enable</Label>
        </div>
      </div>

      {field.conditional && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Show this field when:</Label>
            <Select
              value={field.conditional.dependsOn}
              onValueChange={handleDependencyChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {availableDependencies.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.label || `Field ${allFields.indexOf(dep) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDependency && (
            <div>
              <Label className="text-sm">Equals:</Label>
              <Select
                value={field.conditional.showWhen}
                onValueChange={handleShowWhenChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDependency.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-xs text-gray-600">
            This field will only be shown when "{selectedDependency?.label}" equals "{field.conditional.showWhen}"
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalLogicSection;
