
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { ContributingFactorTab } from '@/components/configuration/ContributingFactorTab';
import { ReportTypeTab } from '@/components/configuration/ReportTypeTab';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

interface ReportType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

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
  contributingFactors: {
    id: string;
    name: string;
    description: string | null;
    weight: string | null;
  }[];
  addContributingFactor: (name: string, description: string, weight: string) => void;
  updateContributingFactor: (id: string, name: string, description: string, weight: string) => void;
  deleteContributingFactor: (id: string) => void;
  reportTypes: ReportType[];
  addReportType: (name: string, description: string) => void;
  updateReportType: (id: string, name: string, description: string) => void;
  deleteReportType: (id: string) => void;
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
  deleteSubcategory,
  contributingFactors,
  addContributingFactor,
  updateContributingFactor,
  deleteContributingFactor,
  reportTypes,
  addReportType,
  updateReportType,
  deleteReportType
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="categories" value={activeTab || 'categories'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="contributingFactors">Contributing Factors</TabsTrigger>
            <TabsTrigger value="reportTypes">Report Types</TabsTrigger>
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

          <TabsContent value="contributingFactors">
            <ContributingFactorTab
              factors={contributingFactors}
              addFactor={addContributingFactor}
              updateFactor={updateContributingFactor}
              deleteFactor={deleteContributingFactor}
            />
          </TabsContent>

          <TabsContent value="reportTypes">
            <ReportTypeTab
              reportTypes={reportTypes}
              addReportType={addReportType}
              updateReportType={updateReportType}
              deleteReportType={deleteReportType}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
