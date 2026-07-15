import React, { useCallback } from 'react';
import { IncidentRelatedConfig } from '@/pages/configuration/IncidentRelatedConfig';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ContributingFactorItem, contributingFactorService } from '@/services/incident/contributingFactorService';
import { reportTypeService } from '@/services/incident/reportTypeService';
import { priorityService } from '@/services/incident/priorityService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useAuth } from '@/contexts';
import Loader from '../common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface ReportType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface PriorityItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  weight: number | null;
  is_active: boolean;
}

const IncidentConfigurationContent = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [contributingFactors, setContributingFactors] = useState<ContributingFactorItem[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { employeeData, user } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const clientTypeId = employeeData?.clientType?.id || user?.clientType?.id;

  // Use the existing hook for categories and subcategories — it now fetches all
  // 5 Incident Configuration resources (categories, subcategories, contributing
  // factors, report types, priorities) in a single edge-function call (listAll),
  // instead of each sub-tab firing its own separate request.
  const {
    categories,
    subcategoryMappings,
    contributingFactors: hookContributingFactors,
    reportTypes: hookReportTypes,
    priorities: hookPriorities,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    loadData,
  } = useIncidentCategories();

  // Seed local state (which the add/update/delete/toggle handlers below update
  // optimistically) from the hook's fetch. Kept as separate local state rather
  // than reading the hook's arrays directly so those handlers don't need to change.
  useEffect(() => {
    setContributingFactors(hookContributingFactors);
    setLoading(false);
  }, [hookContributingFactors]);

  useEffect(() => {
    setReportTypes(hookReportTypes as ReportType[]);
  }, [hookReportTypes]);

  useEffect(() => {
    setPriorities(hookPriorities as PriorityItem[]);
  }, [hookPriorities]);

  // Handle contributing factors operations
  const handleAddContributingFactor = async (name: string, description: string, weight: string) => {
    try {
      if (!employeeData?.clientId) {
        toast.error('Client information not available');
        return;
      }
      const data = await contributingFactorService.addContributingFactor(
        name,
        description,
        weight,
        employeeData.clientId,
        clientTypeId
      );

      setContributingFactors([...contributingFactors, data]);
      toast.success('Contributing factor added successfully');
    } catch (error) {
      console.error('Exception adding contributing factor:', error);
      toast.error(error?.message || 'Failed to add contributing factor');
    }
  };

  const handleUpdateContributingFactor = async (id: string, name: string, description: string, weight: string) => {
    try {
      if (!employeeData?.clientId) {
        toast.error('Client information not available');
        return;
      }

      const data = await contributingFactorService.updateContributingFactor(
        id,
        name,
        description,
        weight,
        employeeData.clientId
      );

      setContributingFactors(
        contributingFactors.map(factor =>
          factor.id === id ? data : factor
        )
      );
      
      toast.success('Contributing factor updated successfully');
    } catch (error) {
      console.error('Exception updating contributing factor:', error);
      toast.error(error?.message || 'Failed to update contributing factor');
    }
  };

  const handleDeleteContributingFactor = async (id: string) => {
    try {
      await contributingFactorService.deleteContributingFactor(id);
      setContributingFactors(contributingFactors.filter(factor => factor.id !== id));
      toast.success('Contributing factor deleted successfully');
    } catch (error) {
      console.error('Exception deleting contributing factor:', error);
      const errorMessage = error?.message || 'Failed to delete contributing factor';
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  // Handle report types operations
  const handleAddReportType = async (name: string, description: string) => {
    try {
      const data = await reportTypeService.addReportType(
        name,
        description || null,
        employeeData?.clientId,
        clientTypeId
      );

      setReportTypes([...reportTypes, data]);
      toast.success('Report type added successfully');
    } catch (error) {
      console.error('Exception adding report type:', error);
      toast.error(error?.message || 'Failed to add report type');
    }
  };

  const handleUpdateReportType = async (id: string, name: string, description: string) => {
    try {
      const data = await reportTypeService.updateReportType(id, name, description || null);

      setReportTypes(
        reportTypes.map(type => (type.id === id ? data : type))
      );
      toast.success('Report type updated successfully');
    } catch (error) {
      console.error('Exception updating report type:', error);
      toast.error(error?.message || 'Failed to update report type');
    }
  };

  const handleDeleteReportType = async (id: string) => {
    try {
      await reportTypeService.deleteReportType(id);
      setReportTypes(reportTypes.filter(type => type.id !== id));
      toast.success('Report type deleted successfully');
    } catch (error) {
      console.error('Exception deleting report type:', error);
      const errorMessage = error?.message || 'Failed to delete report type';
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  const handleToggleReportTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const data = await reportTypeService.toggleReportTypeStatus(id, isActive);

      setReportTypes(
        reportTypes.map(type => (type.id === id ? data : type))
      );
      toast.success(`Report type ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling report type status:', error);
      toast.error(error?.message || `Failed to ${isActive ? 'activate' : 'deactivate'} report type`);
    }
  };

  // Handle priorities operations
  const handleAddPriority = async (name: string, description: string, color: string, weight: number) => {
    try {
      const data = await priorityService.addPriority(
        name,
        description || null,
        color || null,
        weight ?? 0,
        employeeData?.clientId,
        clientTypeId
      );

      setPriorities([...priorities, data]);
      toast.success('Priority added successfully');
    } catch (error) {
      console.error('Exception adding priority:', error);
      toast.error(error?.message || 'Failed to add priority');
    }
  };

  const handleUpdatePriority = async (id: string, name: string, description: string, color: string, weight: number) => {
    try {
      const data = await priorityService.updatePriority(id, name, description || null, color || null, weight ?? 0);

      setPriorities(
        priorities.map(priority => (priority.id === id ? data : priority))
      );
      toast.success('Priority updated successfully');
    } catch (error) {
      console.error('Exception updating priority:', error);
      toast.error(error?.message || 'Failed to update priority');
    }
  };

  const handleDeletePriority = async (id: string) => {
    try {
      await priorityService.deletePriority(id);
      setPriorities(priorities.filter(priority => priority.id !== id));
      toast.success('Priority deleted successfully');
    } catch (error) {
      console.error('Exception deleting priority:', error);
      const errorMessage = error?.message || 'Failed to delete priority';
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  const handleTogglePriorityStatus = async (id: string, isActive: boolean) => {
    try {
      const data = await priorityService.togglePriorityStatus(id, isActive);

      setPriorities(
        priorities.map(priority => (priority.id === id ? data : priority))
      );
      toast.success(`Priority ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling priority status:', error);
      toast.error(error?.message || `Failed to ${isActive ? 'activate' : 'deactivate'} priority`);
    }
  };

  const handleCategoriesUpdated = useCallback(() => {
    loadData();
  }, [loadData]);


  useRealTimeSubHook({
    channelName: `incident-categories-${employeeData?.clientId}`,
    events: '*',
    table: 'incident_categories',
    enabled: !!employeeData?.clientId,
    onPayload: handleCategoriesUpdated,
  });

  useRealTimeSubHook({
    channelName: `incident-subcategories-${employeeData?.clientId}`,
    events: '*',
    table: 'incident_subcategories',
    enabled: !!employeeData?.clientId,
    onPayload: handleCategoriesUpdated,
  });

  // Wait for data to load
  if (loading || categoriesLoading) {
    return (
      
        <Loader text="Loading configuration..." />
      
    );
  }

  return (
    <IncidentRelatedConfig 
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      categories={categories}
      addCategory={addCategory}
      updateCategory={updateCategory}
      deleteCategory={deleteCategory}
      subcategoryMappings={subcategoryMappings}
      addSubcategory={addSubcategory}
      updateSubcategory={updateSubcategory}
      deleteSubcategory={deleteSubcategory}
      contributingFactors={contributingFactors}
      addContributingFactor={handleAddContributingFactor}
      updateContributingFactor={handleUpdateContributingFactor}
      deleteContributingFactor={handleDeleteContributingFactor}
      reportTypes={reportTypes}
      addReportType={handleAddReportType}
      updateReportType={handleUpdateReportType}
      deleteReportType={handleDeleteReportType}
      toggleReportTypeStatus={handleToggleReportTypeStatus}
      priorities={priorities}
      addPriority={handleAddPriority}
      updatePriority={handleUpdatePriority}
      deletePriority={handleDeletePriority}
      togglePriorityStatus={handleTogglePriorityStatus}
      canCreate={!isReadOnlySwitchedContext}
    />
  );
};

export default IncidentConfigurationContent;
