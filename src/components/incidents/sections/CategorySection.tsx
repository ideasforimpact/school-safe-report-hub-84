
import React, { useEffect, useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

interface CategorySectionProps {
  categoryId: string;
  subcategory: string;
  onSelectChange: (name: string, value: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
  category_id: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  subcategory,
  onSelectChange,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryItem[]>([]);

  // Fetch categories from the incident_categories table
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('incident_categories')
          .select('id, name')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching categories:', error);
          toast({
            title: 'Error',
            description: 'Failed to load categories. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Exception fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories from the incident_subcategories table
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const { data, error } = await supabase
          .from('incident_subcategories')
          .select('id, name, category_id')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching subcategories:', error);
          toast({
            title: 'Error',
            description: 'Failed to load subcategories. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        setSubcategories(data || []);
      } catch (err) {
        console.error('Exception fetching subcategories:', err);
      }
    };

    fetchSubcategories();
  }, []);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (!categoryId) {
      setAvailableSubcategories([]);
      return;
    }

    const filtered = subcategories.filter(sub => sub.category_id === categoryId);
    setAvailableSubcategories(filtered);
    
    // Reset subcategory selection when category changes
    if (filtered.length > 0 && !filtered.some(sub => sub.id === subcategory)) {
      onSelectChange('subcategory', '');
    }
  }, [categoryId, subcategories, subcategory, onSelectChange]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2 text-left">
        <label htmlFor="categoryId" className="text-sm font-medium text-left block">
          Category
        </label>
        <Select 
          value={categoryId}
          onValueChange={(value) => onSelectChange('categoryId', value)}
          disabled={loading}
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
          Subcategory
        </label>
        <Select 
          value={subcategory}
          onValueChange={(value) => onSelectChange('subcategory', value)}
          disabled={availableSubcategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map(subcategory => (
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

export default CategorySection;
