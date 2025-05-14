
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';
import { toast } from 'sonner';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';
import { supabase } from '@/integrations/supabase/client';

interface ContributingFactor {
  id: string;
  name: string;
  description: string | null;
  weight: string | null;
}

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>([]);
  const [loading, setLoading] = useState(true);

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
      try {
        const { data, error } = await supabase
          .from('contributing_factors')
          .select('id, name, description, weight')
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
      const { error } = await supabase
        .from('contributing_factors')
        .delete()
        .eq('id', id);

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

  // Wait for data to load
  if (loading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Incident Related Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage incident categories, subcategories, and contributing factors
          </p>
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
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
