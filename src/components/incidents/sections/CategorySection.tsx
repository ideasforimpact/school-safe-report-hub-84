import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string | null;
}

interface CategorySectionProps {
  categoryId: string;
  subcategory: string;
  onSelectChange: (name: string, value: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  loading: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  subcategory,
  onSelectChange,
  categories,
  subcategories,
  loading
}) => {
  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(sub => sub.category_id === categoryId);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={categoryId}
          onValueChange={(value) => {
            onSelectChange('categoryId', value);
            // Reset subcategory when category changes
            onSelectChange('subcategoryId', '');
          }}
          disabled={loading}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={loading ? "Loading..." : "Select category"} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
          Subcategory <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={subcategory}
          onValueChange={(value) => {
            onSelectChange('subcategoryId', value);
          }}
          disabled={loading || !categoryId || filteredSubcategories.length === 0}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={
              loading ? "Loading..." : 
              !categoryId ? "Select category first" : 
              filteredSubcategories.length === 0 ? "No subcategories available" : 
              "Select subcategory"
            } />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {filteredSubcategories.map((subcategoryItem) => (
              <SelectItem key={subcategoryItem.id} value={subcategoryItem.id}>
                {subcategoryItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default CategorySection;
