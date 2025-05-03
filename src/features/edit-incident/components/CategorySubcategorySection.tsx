
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategorySubcategorySectionProps {
  category: string;
  subcategory: string;
  availableSubcategories: string[];
  onSelectChange: (name: string, value: string) => void;
  categoriesForType: string[];
}

const CategorySubcategorySection: React.FC<CategorySubcategorySectionProps> = ({
  category,
  subcategory,
  availableSubcategories,
  onSelectChange,
  categoriesForType,
}) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          value={category}
          onValueChange={(value) => onSelectChange('category', value)}
          required
          disabled={categoriesForType.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categoriesForType.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium">
          Subcategory <span className="text-red-500">*</span>
        </label>
        <Select 
          value={subcategory}
          onValueChange={(value) => onSelectChange('subcategory', value)}
          required
          disabled={availableSubcategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map(subcategory => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default CategorySubcategorySection;
