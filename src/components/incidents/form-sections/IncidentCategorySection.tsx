
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryOption {
  value: string;
  label: string;
}

interface IncidentCategorySectionProps {
  categoryId: string;
  subcategory: string;
  categoryOptions: CategoryOption[];
  subcategoryOptions: CategoryOption[];
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  errors: Record<string, string>;
}

const IncidentCategorySection: React.FC<IncidentCategorySectionProps> = ({
  categoryId,
  subcategory,
  categoryOptions,
  subcategoryOptions,
  onCategoryChange,
  onSubcategoryChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="categoryId" className="text-sm font-medium block">
          Category*
        </label>
        <Select 
          value={categoryId}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger className={`${errors.categoryId ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium block">
          Subcategory*
        </label>
        <Select 
          value={subcategory}
          onValueChange={onSubcategoryChange}
          disabled={subcategoryOptions.length === 0}
        >
          <SelectTrigger className={`${errors.subcategory ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subcategoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subcategory && (
          <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>
        )}
      </div>
    </div>
  );
};

export default IncidentCategorySection;
