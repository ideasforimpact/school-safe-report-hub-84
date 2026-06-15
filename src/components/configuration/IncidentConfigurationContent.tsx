import React, { useCallback, useState } from 'react';
import { IncidentRelatedConfig } from '@/pages/configuration/IncidentRelatedConfig';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { toast } from 'sonner';
import { contributingFactorService } from '@/services/incident/contributingFactorService';
import { reportTypeService } from '@/services/incident/reportTypeService';
import { priorityService } from '@/services/incident/priorityService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useAuth } from '@/contexts';
import Loader from '../common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

const IncidentConfigurationContent = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const { employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  // Single edge-function call via the hook — provides all incident config data
  const {
    categories,
    subcategoryMappings,
    contributingFactors,
    setContributingFactors,
    reportTypes,
    setReportTypes,
    priorities,
    setPriorities,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    loadData,
  } = useIncidentCategories();

  // ------ Contributing factor mutations (update local state, no extra fetch) ------

  const handleAddContributingFactor = async (name: string, description: string, weight: string) => {
    try {
      if (!employeeData?.clientId) throw new Error('Client ID is required');
      const data = await contributingFactorService.addContributingFactor(name, description, weight, employeeData.clientId);
      setContributingFactors(prev => [...prev, data]);
      toast.success('Contributing factor added successfully');
    } catch (error) {
      console.error('Exception adding contributing factor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdateContributingFactor = async (id: string, name: string, description: string, weight: string) => {
    try {
      if (!employeeData?.clientId) throw new Error('Client ID is required');
      const updated = await contributingFactorService.updateContributingFactor(id, name, description, weight, employeeData.clientId);
      setContributingFactors(prev => prev.map(f => f.id === id ? updated : f));
      toast.success('Contributing factor updated successfully');
    } catch (error) {
      console.error('Exception updating contributing factor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteContributingFactor = async (id: string) => {
    try {
      await contributingFactorService.deleteContributingFactor(id);
      setContributingFactors(prev => prev.filter(f => f.id !== id));
      toast.success('Contributing factor deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting contributing factor:', error);
      throw error;
    }
  };

  // ------ Report type mutations ------

  const handleAddReportType = async (name: string, description: string) => {
    try {
      const data = await reportTypeService.addReportType(name, description, employeeData?.clientId);
      setReportTypes(prev => [...prev, data]);
      toast.success('Report type added successfully');
    } catch (error) {
      console.error('Exception adding report type:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdateReportType = async (id: string, name: string, description: string) => {
    try {
      const updated = await reportTypeService.updateReportType(id, name, description, employeeData?.clientId);
      setReportTypes(prev => prev.map(t => t.id === id ? updated : t));
      toast.success('Report type updated successfully');
    } catch (error) {
      console.error('Exception updating report type:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteReportType = async (id: string) => {
    try {
      await reportTypeService.deleteReportType(id);
      setReportTypes(prev => prev.filter(t => t.id !== id));
      toast.success('Report type deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting report type:', error);
      throw error;
    }
  };

  const handleToggleReportTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const updated = await reportTypeService.toggleReportTypeStatus(id, isActive, employeeData?.clientId);
      setReportTypes(prev => prev.map(t => t.id === id ? updated : t));
      toast.success(`Report type ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling report type status:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // ------ Priority mutations ------

  const handleAddPriority = async (name: string, description: string, color: string, weight: number) => {
    try {
      const data = await priorityService.addPriority(name, description, color, weight, employeeData?.clientId);
      setPriorities(prev => [...prev, data]);
      toast.success('Priority added successfully');
    } catch (error) {
      console.error('Exception adding priority:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdatePriority = async (id: string, name: string, description: string, color: string, weight: number) => {
    try {
      const updated = await priorityService.updatePriority(id, name, description, color, weight, employeeData?.clientId);
      setPriorities(prev => prev.map(p => p.id === id ? updated : p));
      toast.success('Priority updated successfully');
    } catch (error) {
      console.error('Exception updating priority:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeletePriority = async (id: string) => {
    try {
      await priorityService.deletePriority(id);
      setPriorities(prev => prev.filter(p => p.id !== id));
      toast.success('Priority deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting priority:', error);
      throw error;
    }
  };

  const handleTogglePriorityStatus = async (id: string, isActive: boolean) => {
    try {
      const updated = await priorityService.togglePriorityStatus(id, isActive, employeeData?.clientId);
      setPriorities(prev => prev.map(p => p.id === id ? updated : p));
      toast.success(`Priority ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling priority status:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCategoriesUpdated = useCallback(() => { loadData(); }, [loadData]);

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

  if (loading) {
    return <Loader text="Loading configuration..." />;
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
