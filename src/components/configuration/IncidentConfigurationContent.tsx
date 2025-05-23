
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryTab from './CategoryTab';
import SubcategoryTab from './SubcategoryTab';
import PriorityTab from './PriorityTab';
import ReportTypeTab from './ReportTypeTab';
import ContributingFactorTab from './ContributingFactorTab';
import { useConfigManagement } from '@/hooks/useConfigManagement';

interface ConfigItem {
  id: string;
  name: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
  categoryId: string;
}

const IncidentConfigurationContent = () => {
  const {
    categories,
    subcategories,
    priorities,
    reportTypes,
    contributingFactors,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addPriority,
    updatePriority,
    deletePriority,
    addReportType,
    updateReportType,
    deleteReportType,
    addContributingFactor,
    updateContributingFactor,
    deleteContributingFactor
  } = useConfigManagement();

  const subcategoryMap = subcategories.reduce((acc, sub) => {
    if (!acc[sub.categoryId]) {
      acc[sub.categoryId] = [];
    }
    acc[sub.categoryId].push(sub);
    return acc;
  }, {} as Record<string, SubcategoryItem[]>);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="report-types">Report Types</TabsTrigger>
          <TabsTrigger value="contributing-factors">Contributing Factors</TabsTrigger>
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
            subcategories={subcategories}
            onAdd={addSubcategory}
            onUpdate={updateSubcategory}
            onDelete={deleteSubcategory}
          />
        </TabsContent>

        <TabsContent value="priorities">
          <PriorityTab
            priorities={priorities}
            onAdd={addPriority}
            onUpdate={updatePriority}
            onDelete={deletePriority}
          />
        </TabsContent>

        <TabsContent value="report-types">
          <ReportTypeTab
            reportTypes={reportTypes}
            onAdd={addReportType}
            onUpdate={updateReportType}
            onDelete={deleteReportType}
          />
        </TabsContent>

        <TabsContent value="contributing-factors">
          <ContributingFactorTab
            contributingFactors={contributingFactors}
            onAdd={addContributingFactor}
            onUpdate={updateContributingFactor}
            onDelete={deleteContributingFactor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentConfigurationContent;
