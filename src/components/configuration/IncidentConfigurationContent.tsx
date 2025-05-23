
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { PriorityTab } from '@/components/configuration/PriorityTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { ContributingFactorTab } from '@/components/configuration/ContributingFactorTab';
import { ReportTypeTab } from '@/components/configuration/ReportTypeTab';
import { useCategoryManagement } from '@/hooks/config/useCategoryManagement';

const IncidentConfigurationContent = () => {
  const [activeConfigTab, setActiveConfigTab] = React.useState('categories');
  const {
    categories,
    subcategoryMappings,
    loading,
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
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoryTab
            categories={categories}
            loading={loading}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        </TabsContent>
        
        <TabsContent value="subcategories">
          <SubcategoryTab
            categories={categories}
            subcategories={subcategoryMappings}
            loading={loading}
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
