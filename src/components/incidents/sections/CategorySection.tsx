
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConfigItem {
  id: string;
  name: string;
}

interface CategorySectionProps {
  categoryId: string;
  categories: ConfigItem[];
  subcategory: string;
  availableSubcategories: {id: string, name: string}[];
  onSelectChange: (name: string, value: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  categories,
  subcategory,
  availableSubcategories,
  onSelectChange,
}) => {
  return (
    <>
      <div className="space-y-2 text-left">
        <label htmlFor="categoryId" className="text-sm font-medium text-left block">
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
      
      <div className="space-y-2 text-left">
        <label htmlFor="subcategory" className="text-sm font-medium text-left block">
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
              <SelectItem key={subcategory.id} value={subcategory.name}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default CategorySection;
