
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { useCategoryManagement } from '@/hooks/config/useCategoryManagement';

interface CategoryTabProps {
  categories: any[];
  onAdd: (name: string) => any;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

interface SubcategoryTabProps {
  categories: any[];
  subcategoryMap: Record<string, any[]>;
  onAdd: (categoryId: string, name: string) => any;
  onUpdate: (categoryId: string, id: string, name: string) => void;
  onDelete: (categoryId: string, id: string) => void;
}

const IncidentConfigurationContent = () => {
  const [activeConfigTab, setActiveConfigTab] = React.useState('categories');
  const {
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useCategoryManagement();
  
  return (
    <div className="space-y-6">
      <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoryTab
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        </TabsContent>
        
        <TabsContent value="subcategories">
          <SubcategoryTab
            categories={categories}
            subcategoryMap={subcategoryMappings}
            onAdd={addSubcategory}
            onUpdate={updateSubcategory}
            onDelete={deleteSubcategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentConfigurationContent;
