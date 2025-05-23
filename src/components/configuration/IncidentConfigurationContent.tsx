
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryTab } from './CategoryTab';
import { SubcategoryTab } from './SubcategoryTab';
import { PriorityTab } from './PriorityTab';
import { ReportTypeTab } from './ReportTypeTab';
import { ContributingFactorTab } from './ContributingFactorTab';
import { useCategoryManagement } from '@/hooks/config/useCategoryManagement';

interface ConfigItem {
  id: string;
  name: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
}

const IncidentConfigurationContent = () => {
  // Initialize with empty data for now
  const {
    categories,
    subcategoryMappings,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useCategoryManagement([], {});

  // Mock data for other configuration items
  const priorities: any[] = [];
  const reportTypes: any[] = [];
  const contributingFactors: any[] = [];

  // Mock handlers for priorities
  const addPriority = (name: string, description: string, color: string, weight: number) => {
    console.log('Add priority:', { name, description, color, weight });
  };

  const updatePriority = (id: string, name: string, description: string, color: string, weight: number) => {
    console.log('Update priority:', { id, name, description, color, weight });
  };

  const deletePriority = (id: string) => {
    console.log('Delete priority:', id);
  };

  const togglePriorityStatus = (id: string, isActive: boolean) => {
    console.log('Toggle priority status:', { id, isActive });
  };

  // Mock handlers for report types
  const addReportType = (name: string, description: string) => {
    console.log('Add report type:', { name, description });
  };

  const updateReportType = (id: string, name: string, description: string) => {
    console.log('Update report type:', { id, name, description });
  };

  const deleteReportType = (id: string) => {
    console.log('Delete report type:', id);
  };

  const toggleReportTypeStatus = (id: string, isActive: boolean) => {
    console.log('Toggle report type status:', { id, isActive });
  };

  // Mock handlers for contributing factors
  const addContributingFactor = (name: string, description: string, weight: string) => {
    console.log('Add contributing factor:', { name, description, weight });
  };

  const updateContributingFactor = (id: string, name: string, description: string, weight: string) => {
    console.log('Update contributing factor:', { id, name, description, weight });
  };

  const deleteContributingFactor = (id: string) => {
    console.log('Delete contributing factor:', id);
  };

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

        <TabsContent value="priorities">
          <PriorityTab
            priorities={priorities}
            addPriority={addPriority}
            updatePriority={updatePriority}
            deletePriority={deletePriority}
            togglePriorityStatus={togglePriorityStatus}
          />
        </TabsContent>

        <TabsContent value="report-types">
          <ReportTypeTab
            reportTypes={reportTypes}
            addReportType={addReportType}
            updateReportType={updateReportType}
            deleteReportType={deleteReportType}
            toggleReportTypeStatus={toggleReportTypeStatus}
          />
        </TabsContent>

        <TabsContent value="contributing-factors">
          <ContributingFactorTab
            contributingFactors={contributingFactors}
            addFactor={addContributingFactor}
            updateFactor={updateContributingFactor}
            deleteFactor={deleteContributingFactor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentConfigurationContent;
