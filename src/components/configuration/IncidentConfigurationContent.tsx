import React, { useCallback } from 'react';
import { IncidentRelatedConfig } from '@/pages/configuration/IncidentRelatedConfig';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const { employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  // Use the existing hook for categories and subcategories
  const {
    categories,
    subcategoryMappings,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    loadData,
  } = useIncidentCategories();

  // Fetch contributing factors
  useEffect(() => {
    async function fetchContributingFactors() {
      try {
        const { data, error } = await supabase
          .from('contributing_factors')
          .select('id, name, description, weight, client_id')
          .order('name');
        
        if (error) {
          console.error('Error fetching contributing factors:', error);
          toast.error('Failed to load contributing factors');
          return;
        }
        
        setContributingFactors(data || []);
      } catch (error) {
        console.error('Exception fetching contributing factors:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchContributingFactors();
  }, []);

  // Fetch report types
  useEffect(() => {
    async function fetchReportTypes() {
      try {
        const { data, error } = await supabase
          .from('incident_report_types')
          .select('id, name, description, is_active')
          .order('name');
        
        if (error) {
          console.error('Error fetching report types:', error);
          toast.error('Failed to load report types');
          return;
        }
        
        setReportTypes(data || []);
      } catch (error) {
        console.error('Exception fetching report types:', error);
        toast.error('An unexpected error occurred');
      }
    }

    fetchReportTypes();
  }, []);

  // Fetch priorities
  useEffect(() => {
    async function fetchPriorities() {
      try {
        const { data, error } = await supabase
          .from('incident_priorities')
          .select('id, name, description, color, weight, is_active')
          .order('weight');
        
        if (error) {
          console.error('Error fetching priorities:', error);
          toast.error('Failed to load priorities');
          return;
        }
        
        setPriorities(data || []);
      } catch (error) {
        console.error('Exception fetching priorities:', error);
        toast.error('An unexpected error occurred');
      }
    }

    fetchPriorities();
  }, []);

  // Handle contributing factors operations
  const handleAddContributingFactor = async (name: string, description: string, weight: string) => {
    try {
      const { data, error } = await supabase
        .from('contributing_factors')
        .insert([
          { name, description: description || null, weight },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding contributing factor:', error);
        toast.error('Failed to add contributing factor');
        return;
      }

      setContributingFactors([...contributingFactors, data]);
      toast.success('Contributing factor added successfully');
    } catch (error) {
      console.error('Exception adding contributing factor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdateContributingFactor = async (id: string, name: string, description: string, weight: string) => {
    try {
      const { error } = await supabase
        .from('contributing_factors')
        .update({ name, description: description || null, weight })
        .eq('id', id);

      if (error) {
        console.error('Error updating contributing factor:', error);
        toast.error('Failed to update contributing factor');
        return;
      }

      setContributingFactors(
        contributingFactors.map(factor =>
          factor.id === id
            ? { ...factor, name, description: description || null, weight }
            : factor
        )
      );
      
      toast.success('Contributing factor updated successfully');
    } catch (error) {
      console.error('Exception updating contributing factor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteContributingFactor = async (id: string) => {
    try {
      await contributingFactorService.deleteContributingFactor(id);
      setContributingFactors(contributingFactors.filter(factor => factor.id !== id));
      toast.success('Contributing factor deleted successfully');
    } catch (error: any) {
      console.error('Exception deleting contributing factor:', error);
      const errorMessage = error?.message || 'Failed to delete contributing factor';
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  // Handle report types operations
  const handleAddReportType = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert([
          { name, description: description || null }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding report type:', error);
        toast.error('Failed to add report type');
        return;
      }

      setReportTypes([...reportTypes, data]);
      toast.success('Report type added successfully');
    } catch (error) {
      console.error('Exception adding report type:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdateReportType = async (id: string, name: string, description: string) => {
    try {
      const { error } = await supabase
        .from('incident_report_types')
        .update({ name, description: description || null })
        .eq('id', id);

      if (error) {
        console.error('Error updating report type:', error);
        toast.error('Failed to update report type');
        return;
      }

      setReportTypes(
        reportTypes.map(type =>
          type.id === id
            ? { ...type, name, description: description || null }
            : type
        )
      );
      
      toast.success('Report type updated successfully');
    } catch (error) {
      console.error('Exception updating report type:', error);
      toast.error('An unexpected error occurred');
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
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  const handleToggleReportTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('incident_report_types')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Error toggling report type status:', error);
        toast.error(`Failed to ${isActive ? 'activate' : 'deactivate'} report type`);
        return;
      }

      setReportTypes(
        reportTypes.map(type =>
          type.id === id
            ? { ...type, is_active: isActive }
            : type
        )
      );
      
      toast.success(`Report type ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling report type status:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Handle priorities operations
  const handleAddPriority = async (name: string, description: string, color: string, weight: number) => {
    try {
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert([
          { name, description: description || null, color, weight }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding priority:', error);
        toast.error('Failed to add priority');
        return;
      }

      setPriorities([...priorities, data]);
      toast.success('Priority added successfully');
    } catch (error) {
      console.error('Exception adding priority:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdatePriority = async (id: string, name: string, description: string, color: string, weight: number) => {
    try {
      const { error } = await supabase
        .from('incident_priorities')
        .update({ name, description: description || null, color, weight })
        .eq('id', id);

      if (error) {
        console.error('Error updating priority:', error);
        toast.error('Failed to update priority');
        return;
      }

      setPriorities(
        priorities.map(priority =>
          priority.id === id
            ? { ...priority, name, description: description || null, color, weight }
            : priority
        )
      );
      
      toast.success('Priority updated successfully');
    } catch (error) {
      console.error('Exception updating priority:', error);
      toast.error('An unexpected error occurred');
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
      // Error will be handled by the component that calls this
      throw error; // Re-throw to let the calling component handle it
    }
  };

  const handleTogglePriorityStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('incident_priorities')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Error toggling priority status:', error);
        toast.error(`Failed to ${isActive ? 'activate' : 'deactivate'} priority`);
        return;
      }

      setPriorities(
        priorities.map(priority =>
          priority.id === id
            ? { ...priority, is_active: isActive }
            : priority
        )
      );
      
      toast.success(`Priority ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Exception toggling priority status:', error);
      toast.error('An unexpected error occurred');
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
