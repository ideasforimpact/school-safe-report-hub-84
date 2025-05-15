
import React from 'react';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

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
  errors = {}
}) => {
  const { categories, loading: categoriesLoading } = useIncidentCategories();
  const { 
    availableSubcategories,
    loading: subcategoriesLoading
  } = useSubcategories(categoryId);

  const handleCategoryChange = (value: string) => {
    onSelectChange('categoryId', value);
    // Reset subcategory when category changes
    onSelectChange('subcategory', '');
  };

  const handleSubcategoryChange = (value: string) => {
    onSelectChange('subcategory', value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Category</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="categoryId" className="text-sm font-medium block">
            Category <span className="text-red-500">*</span>
          </label>
          <Select 
            value={categoryId}
            onValueChange={handleCategoryChange}
            disabled={categoriesLoading}
          >
            <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
              {categoriesLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading categories...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select category" />
              )}
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
            Subcategory <span className="text-red-500">*</span>
          </label>
          <Select 
            value={subcategory}
            onValueChange={handleSubcategoryChange}
            disabled={!categoryId || subcategoriesLoading}
          >
            <SelectTrigger className={errors.subcategory ? "border-red-500" : ""}>
              {subcategoriesLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading subcategories...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select subcategory" />
              )}
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories.map(sub => (
                <SelectItem key={sub.id} value={sub.name}>
                  {sub.name}
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
