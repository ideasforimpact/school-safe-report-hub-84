
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

interface TemplateBasicInfoProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  type: string;
  setType: (type: string) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  typeRef?: React.RefObject<HTMLButtonElement>;
}

const TemplateBasicInfo: React.FC<TemplateBasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType,
  isActive,
  setIsActive,
  typeRef
}) => {
  const [titleError, setTitleError] = useState<string | null>(null);
  const [templateTypes, setTemplateTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchTemplateTypes = async () => {
      const { data, error } = await supabase
        .from('template_categories')
        .select('name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching template categories:', error);
        setLoadingTypes(false);
        return;
      }

      const categories = data.map((item: any) => item.name);
      setTemplateTypes(categories);
      setLoadingTypes(false);
    };

    fetchTemplateTypes();
  }, []);

  useEffect(() => {
    if (!type || templateTypes.length === 0) return;

    const normalizedType = type.trim().toLowerCase();
    const matched = templateTypes.find(
      (category) => category.trim().toLowerCase() === normalizedType
    );

    if (matched && matched !== type) {
      setType(matched);
    }
  }, [type, templateTypes, setType]);

  const selectOptions = useMemo(() => {
    const normalizedType = type.trim().toLowerCase();
    const hasMatchingType = templateTypes.some(
      (category) => category.trim().toLowerCase() === normalizedType
    );

    if (type && !hasMatchingType) {
      return [type, ...templateTypes];
    }

    return templateTypes;
  }, [type, templateTypes]);

  // Validation function for template title (no special characters allowed)
  const isValidTemplateTitle = (value: string) => {
    return /^[a-zA-Z0-9\s]{1,25}$/.test(value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    
    // Clear error if field is empty (user is typing)
    if (value === '') {
      setTitleError(null);
      return;
    }
    
    // Validate as user types
    if (!isValidTemplateTitle(value)) {
      setTitleError('Template title can only contain letters, numbers, and spaces');
    } else {
      setTitleError(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Template Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter template title"
            maxLength={25}
            required
            className={titleError ? 'border-red-500' : ''}
          />
          {titleError && (
            <p className="text-sm text-red-500 mt-1">{titleError}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description"
            maxLength={150}
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="type">Assessment Type <span className="text-red-500">*</span></Label>
          <Select
            value={type || ''}
            disabled={loadingTypes}
            onValueChange={(value) => {
              setType(value);
            }}
          >
            <SelectTrigger ref={typeRef}>
              <SelectValue placeholder="Select assessment type" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((templateType) => (
                <SelectItem key={templateType} value={templateType}>
                  {templateType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="is-active">Enable Template</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateBasicInfo;
