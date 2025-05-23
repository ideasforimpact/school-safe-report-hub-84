
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    subcategories,
    priorities,
    locations,
    contributingFactors,
    reportTypes,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addPriority,
    updatePriority,
    deletePriority,
    addLocation,
    updateLocation,
    deleteLocation,
    addContributingFactor,
    updateContributingFactor,
    deleteContributingFactor,
    addReportType,
    updateReportType,
    deleteReportType,
  } = useCategoryManagement();
  
  return (
    <div className="space-y-6">
      <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="factors">Contributing Factors</TabsTrigger>
          <TabsTrigger value="report-types">Report Types</TabsTrigger>
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
            subcategories={subcategories}
            loading={loading}
            onAdd={addSubcategory}
            onUpdate={updateSubcategory}
            onDelete={deleteSubcategory}
          />
        </TabsContent>
        
        <TabsContent value="priorities">
          <PriorityTab
            priorities={priorities}
            loading={loading}
            onAdd={addPriority}
            onUpdate={updatePriority}
            onDelete={deletePriority}
          />
        </TabsContent>
        
        <TabsContent value="locations">
          <LocationTab
            locations={locations}
            loading={loading}
            onAdd={addLocation}
            onUpdate={updateLocation}
            onDelete={deleteLocation}
          />
        </TabsContent>
        
        <TabsContent value="factors">
          <ContributingFactorTab
            contributingFactors={contributingFactors}
            loading={loading}
            onAdd={addContributingFactor}
            onUpdate={updateContributingFactor}
            onDelete={deleteContributingFactor}
          />
        </TabsContent>
        
        <TabsContent value="report-types">
          <ReportTypeTab
            reportTypes={reportTypes}
            loading={loading}
            onAdd={addReportType}
            onUpdate={updateReportType}
            onDelete={deleteReportType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentConfigurationContent;
