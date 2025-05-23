
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';
import { toast } from 'sonner';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ContributingFactor {
  id: string;
  name: string;
  description: string | null;
  weight: string | null;
}

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

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
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

  // Fetch contributing factors
  useEffect(() => {
    async function fetchContributingFactors() {
      if (!employeeData?.clientId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contributing_factors')
          .select('id, name, description, weight')
          .eq('client_id', employeeData.clientId)
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
  }, [employeeData?.clientId]);

  // Fetch report types
  useEffect(() => {
    async function fetchReportTypes() {
      if (!employeeData?.clientId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('incident_report_types')
          .select('id, name, description, is_active')
          .eq('client_id', employeeData.clientId)
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
  }, [employeeData?.clientId]);

  // Fetch priorities
  useEffect(() => {
    async function fetchPriorities() {
      if (!employeeData?.clientId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('incident_priorities')
          .select('id, name, description, color, weight, is_active')
          .eq('client_id', employeeData.clientId)
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
  }, [employeeData?.clientId]);

  // Handle contributing factors operations
  const handleAddContributingFactor = async (name: string, description: string, weight: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contributing_factors')
        .insert([
          { name, description: description || null, weight, client_id: employeeData.clientId },
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
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

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
      const { error } = await supabase
        .from('contributing_factors')
        .delete()
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

      if (error) {
        console.error('Error deleting contributing factor:', error);
        toast.error('Failed to delete contributing factor');
        return;
      }

      setContributingFactors(contributingFactors.filter(factor => factor.id !== id));
      toast.success('Contributing factor deleted successfully');
    } catch (error) {
      console.error('Exception deleting contributing factor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Handle report types operations
  const handleAddReportType = async (name: string, description: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert([
          { name, description: description || null, client_id: employeeData.clientId }
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
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

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
      const { error } = await supabase
        .from('incident_report_types')
        .delete()
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

      if (error) {
        console.error('Error deleting report type:', error);
        toast.error('Failed to delete report type');
        return;
      }

      setReportTypes(reportTypes.filter(type => type.id !== id));
      toast.success('Report type deleted successfully');
    } catch (error) {
      console.error('Exception deleting report type:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleToggleReportTypeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('incident_report_types')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

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
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert([
          { name, description: description || null, color, weight, client_id: employeeData.clientId }
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
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

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
      const { error } = await supabase
        .from('incident_priorities')
        .delete()
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

      if (error) {
        console.error('Error deleting priority:', error);
        toast.error('Failed to delete priority');
        return;
      }

      setPriorities(priorities.filter(priority => priority.id !== id));
      toast.success('Priority deleted successfully');
    } catch (error) {
      console.error('Exception deleting priority:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleTogglePriorityStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('incident_priorities')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('client_id', employeeData?.clientId);

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
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
