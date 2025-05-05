
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';
import { CategoryTab } from './CategoryTab';
import { SubcategoryTab } from './SubcategoryTab';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

interface CategoryConfigTabsProps {
  categories: ConfigItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
}

export const CategoryConfigTabs = ({
  categories,
  subcategoryMappings,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory
}: CategoryConfigTabsProps) => {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="categories" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Categories</span>
        </TabsTrigger>
        <TabsTrigger value="subcategories" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Subcategories</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="categories">
        <CategoryTab 
          categories={categories}
          addCategory={addCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
        />
      </TabsContent>
      
      <TabsContent value="subcategories">
        <SubcategoryTab 
          categories={categories}
          subcategoryMappings={subcategoryMappings}
          addSubcategory={addSubcategory}
          updateSubcategory={updateSubcategory}
          deleteSubcategory={deleteSubcategory}
        />
      </TabsContent>
    </Tabs>
  );
};
