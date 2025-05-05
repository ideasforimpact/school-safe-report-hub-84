
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useIncidents } from '@/contexts/IncidentContext';
import { useCategoryManager } from '@/hooks/useCategoryManager';
import { useDigitalSafetyCategory } from '@/hooks/useDigitalSafetyCategory';
import { CategoryConfigTabs } from '@/components/configuration/CategoryConfigTabs';

const CategoryConfiguration = () => {
  const { 
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    subcategoryMappings,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useIncidents();

  // Add Digital Safety category if it doesn't exist
  useDigitalSafetyCategory(categories, addCategory);

  // Use the category manager hook
  const {
    localCategories,
    localSubcategoryMappings,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSubcategory,
    handleUpdateSubcategory,
    handleDeleteSubcategory
  } = useCategoryManager({
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Category Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage categories and subcategories for incident reporting
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CategoryConfigTabs
              categories={localCategories}
              subcategoryMappings={localSubcategoryMappings}
              addCategory={handleAddCategory}
              updateCategory={handleUpdateCategory}
              deleteCategory={handleDeleteCategory}
              addSubcategory={handleAddSubcategory}
              updateSubcategory={handleUpdateSubcategory}
              deleteSubcategory={handleDeleteSubcategory}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CategoryConfiguration;
