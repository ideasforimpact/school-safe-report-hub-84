
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { templateService, TemplateCategory } from '@/services/assessment/templateService';

interface TemplateBasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  type: string;
  setType: (value: string) => void;
}

const TemplateBasicInfo: React.FC<TemplateBasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType
}) => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await templateService.getTemplateCategories();
        setCategories(data);
        
        // Set default type if not set and categories are available
        if (!type && data.length > 0) {
          setType(data[0].name);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [type, setType]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Template Title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Enter template title" 
          className="mt-1" 
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Describe the purpose of this assessment template" 
          className="mt-1" 
          rows={3} 
        />
      </div>
      
      <div>
        <Label>Template Category</Label>
        {loading ? (
          <div className="mt-2 text-sm text-gray-500">Loading categories...</div>
        ) : (
          <RadioGroup value={type} onValueChange={setType} className="flex space-x-4 mt-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <RadioGroupItem value={category.name} id={category.name.toLowerCase()} />
                <Label htmlFor={category.name.toLowerCase()}>{category.name}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  );
};

export default TemplateBasicInfo;
