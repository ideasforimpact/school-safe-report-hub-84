
import React from 'react';
import { ConfigItem } from '@/contexts/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncidentCategorySectionProps {
  categoryId: string;
  subcategory: string;
  categories: ConfigItem[];
  availableSubcategories: { id: string, name: string }[];
  onSelectChange: (name: string, value: string) => void;
  errors: Record<string, string>;
}

const IncidentCategorySection: React.FC<IncidentCategorySectionProps> = ({
  categoryId,
  subcategory,
  categories,
  availableSubcategories,
  onSelectChange,
  errors
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium block">
          Category*
        </label>
        <Select
          value={categoryId}
          onValueChange={(value) => onSelectChange('categoryId', value)}
        >
          <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId}</p>}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium block">
          Subcategory
        </label>
        <Select
          value={subcategory}
          onValueChange={(value) => onSelectChange('subcategory', value)}
          disabled={!categoryId || availableSubcategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={!categoryId ? "Select a category first" : "Select a subcategory"} />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default IncidentCategorySection;
