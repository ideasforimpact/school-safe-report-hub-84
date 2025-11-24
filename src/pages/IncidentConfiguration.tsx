
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';
import { toast } from 'sonner';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useAuth } from '@/contexts/auth/useAuth';
import { reportTypeService } from '@/services/incident/reportTypeService';
import { priorityService } from '@/services/incident/priorityService';

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');
  const [reportTypes, setReportTypes] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { employeeData } = useAuth();

  // Use the custom hook for categories and subcategories
  const {
    categories,
    subcategoryMappings,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useIncidentCategories();

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch report types using the new service with RLS
  useEffect(() => {
    async function fetchReportTypes() {
      try {
        const types = await reportTypeService.getReportTypes(true);
        setReportTypes(types);
      } catch (error) {
        console.error('Exception fetching report types:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReportTypes();
  }, []);

  // Fetch priorities using the new service
  useEffect(() => {
    async function fetchPriorities() {
      try {
        const items = await priorityService.getPriorities();
        setPriorities(items);
      } catch (error) {
        console.error('Exception fetching priorities:', error);
      }
    }

    fetchPriorities();
  }, []);

  // Handle report types operations using the new service with RLS
  const handleAddReportType = async (name: string, description: string) => {
    try {
      const newType = await reportTypeService.addReportType(name, description);
      setReportTypes([...reportTypes, newType]);
      toast.success('Report type added successfully');
    } catch (error) {
      console.error('Exception adding report type:', error);
    }
  };

  const handleUpdateReportType = async (id: string, name: string, description: string) => {
    try {
      const updatedType = await reportTypeService.updateReportType(id, name, description);
      setReportTypes(
        reportTypes.map(type =>
          type.id === id ? updatedType : type
        )
      );
      toast.success('Report type updated successfully');
    } catch (error) {
      console.error('Exception updating report type:', error);
    }
  };

  const handleDeleteReportType = async (id: string) => {
    try {
      await reportTypeService.deleteReportType(id);
      setReportTypes(reportTypes.filter(type => type.id !== id));
      toast.success('Report type deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting report type:', error);
      const errorMessage = error?.message || 'Failed to delete report type';
      toast.error(errorMessage);
    }
  };

  const handleToggleReportTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const updatedType = await reportTypeService.toggleReportTypeStatus(id, isActive);
      setReportTypes(
        reportTypes.map(type =>
          type.id === id ? updatedType : type
        )
      );
      toast.success(`Report type ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling report type status:', error);
    }
  };

  // Handle priorities operations using the new service
  const handleAddPriority = async (name: string, description: string, color: string, weight: number) => {
    try {
      const newPriority = await priorityService.addPriority(name, description, color, weight);
      setPriorities([...priorities, newPriority]);
      toast.success('Priority added successfully');
    } catch (error) {
      console.error('Exception adding priority:', error);
    }
  };

  const handleUpdatePriority = async (id: string, name: string, description: string, color: string, weight: number) => {
    try {
      const updatedPriority = await priorityService.updatePriority(id, name, description, color, weight);
      setPriorities(
        priorities.map(priority =>
          priority.id === id ? updatedPriority : priority
        )
      );
      toast.success('Priority updated successfully');
    } catch (error) {
      console.error('Exception updating priority:', error);
    }
  };

  const handleDeletePriority = async (id: string) => {
    try {
      await priorityService.deletePriority(id);
      setPriorities(priorities.filter(priority => priority.id !== id));
      toast.success('Priority deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting priority:', error);
      const errorMessage = error?.message || 'Failed to delete priority';
      toast.error(errorMessage);
    }
  };

  const handleTogglePriorityStatus = async (id: string, isActive: boolean) => {
    try {
      const updatedPriority = await priorityService.togglePriorityStatus(id, isActive);
      setPriorities(
        priorities.map(priority =>
          priority.id === id ? updatedPriority : priority
        )
      );
      toast.success(`Priority ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling priority status:', error);
    }
  };

  // Dummy handlers for contributing factors (these will be handled by the ContributingFactorTab component)
  const handleAddContributingFactor = () => {};
  const handleUpdateContributingFactor = () => {};
  const handleDeleteContributingFactor = () => {};

  // Show loading or no client access message
  if (!employeeData?.clientId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-500">Client information not available. Please contact your administrator.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Wait for data to load
  if (loading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Incident Configuration</h1>
          <p className="text-gray-600 mt-2">Configure incident-related settings and data</p>
        </div>
        
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
          contributingFactors={[]}
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
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
