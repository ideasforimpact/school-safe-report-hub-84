
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useSubcategories } from '@/hooks/useSubcategories';

interface CategorySectionProps {
  categoryId: string;
  subcategory: string;
  onSelectChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  subcategory,
  onSelectChange,
  errors = {},
}) => {
  const { categories, loading: loadingCategories } = useIncidentCategories();
  const { availableSubcategories, loading: loadingSubcategories } = useSubcategories(categoryId);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Categorization</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label htmlFor="categoryId" className="text-sm font-medium block">
            Category
            {errors.categoryId && <span className="text-red-500">*</span>}
          </label>
          <Select 
            value={categoryId}
            onValueChange={(value) => onSelectChange('categoryId', value)}
            disabled={loadingCategories}
          >
            <SelectTrigger className={`${errors.categoryId ? "border-red-500" : ""}`}>
              <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
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
            Subcategory
            {errors.subcategory && <span className="text-red-500">*</span>}
          </label>
          <Select 
            value={subcategory}
            onValueChange={(value) => onSelectChange('subcategory', value)}
            disabled={loadingSubcategories || !categoryId}
          >
            <SelectTrigger className={`${errors.subcategory ? "border-red-500" : ""}`}>
              <SelectValue placeholder={
                loadingSubcategories ? "Loading..." : 
                !categoryId ? "Select a category first" : 
                "Select subcategory"
              } />
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories.map(subcat => (
                <SelectItem key={subcat.id} value={subcat.name}>
                  {subcat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && (
            <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySection;
