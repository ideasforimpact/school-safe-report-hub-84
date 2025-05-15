
import React, { useEffect, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CategorySectionProps {
  categoryId: string;
  subcategory: string;
  onSelectChange: (name: string, value: string) => void;
  categories?: { id: string; name: string; }[];
  subcategories?: { id: string; name: string; category_id: string | null }[];
  loading?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  subcategory,
  onSelectChange,
  categories = [],
  subcategories = [],
  loading = false
}) => {
  const [availableSubcategories, setAvailableSubcategories] = useState<{id: string, name: string}[]>([]);

  // Filter subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter(sub => sub.category_id === categoryId);
      setAvailableSubcategories(filtered);
      
      // Reset subcategory if current selection isn't available in the new list
      const currentSubcategoryExists = filtered.some(sub => sub.name === subcategory);
      if (subcategory && !currentSubcategoryExists) {
        onSelectChange('subcategory', '');
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [categoryId, subcategories, subcategory, onSelectChange]);

  return (
    <div className="space-y-4 text-left">
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium block">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          value={categoryId} 
          onValueChange={(value) => onSelectChange('categoryId', value)}
          required
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select category" />
            )}
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <SelectItem disabled value="">No categories available</SelectItem>
            ) : (
              categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="subcategory" className="text-sm font-medium block">
          Subcategory <span className="text-red-500">*</span>
        </label>
        <Select 
          value={subcategory} 
          onValueChange={(value) => onSelectChange('subcategory', value)}
          disabled={!categoryId || availableSubcategories.length === 0 || loading}
          required
        >
          <SelectTrigger className="w-full">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select subcategory" />
            )}
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.length === 0 ? (
              <SelectItem disabled value="">No subcategories available</SelectItem>
            ) : (
              availableSubcategories.map(sub => (
                <SelectItem key={sub.id} value={sub.name}>
                  {sub.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategorySection;
