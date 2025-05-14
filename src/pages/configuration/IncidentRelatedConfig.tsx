
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

interface IncidentRelatedConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: ConfigItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
}

export const IncidentRelatedConfig: React.FC<IncidentRelatedConfigProps> = ({
  activeTab,
  setActiveTab,
  categories,
  addCategory,
  updateCategory,
  deleteCategory,
  subcategoryMappings,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="categories" value={activeTab || 'categories'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
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
      </CardContent>
    </Card>
  );
};
