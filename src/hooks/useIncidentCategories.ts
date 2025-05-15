
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';
import { useCategoryManagement } from '@/hooks/config/useCategoryManagement';

export const useIncidentCategories = () => {
  const [loading, setLoading] = useState(true);
  const [initialCategories, setInitialCategories] = useState<ConfigItem[]>([]);
  const [initialSubcategories, setInitialSubcategories] = useState<Record<string, SubcategoryItem[]>>({});
  
  const {
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useCategoryManagement(initialCategories, initialSubcategories);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        // Fetch categories from Supabase
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('incident_categories')
          .select('id, name, description')
          .order('name');
          
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          return;
        }
        
        if (categoriesData) {
          const fetchedCategories = categoriesData.map((cat) => ({
            id: cat.id,
            name: cat.name
          }));
          
          setInitialCategories(fetchedCategories);
          
          // Fetch subcategories for all categories
          const { data: subcategoriesData, error: subcategoriesError } = await supabase
            .from('incident_subcategories')
            .select('id, name, category_id')
            .order('name');
            
          if (subcategoriesError) {
            console.error('Error fetching subcategories:', subcategoriesError);
            return;
          }
          
          if (subcategoriesData) {
            // Group subcategories by category_id
            const subcatMap: Record<string, SubcategoryItem[]> = {};
            
            subcategoriesData.forEach((subcat) => {
              if (!subcat.category_id) return;
              
              if (!subcatMap[subcat.category_id]) {
                subcatMap[subcat.category_id] = [];
              }
              
              subcatMap[subcat.category_id].push({
                id: subcat.id,
                name: subcat.name
              });
            });
            
            setInitialSubcategories(subcatMap);
          }
        }
      } catch (error) {
        console.error('Exception in useIncidentCategories:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  return {
    categories,
    subcategoryMappings,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
};
