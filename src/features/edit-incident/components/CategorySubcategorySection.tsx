
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfigItem } from '@/contexts/types';

interface CategorySubcategorySectionProps {
  categoryId: string;
  categories: ConfigItem[];
  subcategory: string;
  availableSubcategories: {id: string, name: string}[];
  onSelectChange: (name: string, value: string) => void;
}

const CategorySubcategorySection: React.FC<CategorySubcategorySectionProps> = ({
  categoryId,
  categories,
  subcategory,
  availableSubcategories,
  onSelectChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          value={categoryId}
          onValueChange={(value) => onSelectChange('categoryId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium">
          Subcategory
        </label>
        <Select 
          value={subcategory}
          onValueChange={(value) => onSelectChange('subcategory', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map(sub => (
              <SelectItem key={sub.id} value={sub.name}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategorySubcategorySection;
