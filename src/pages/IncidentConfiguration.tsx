
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';
import { toast } from 'sonner';
import { useIncidentCategories } from '@/hooks/useIncidentCategories';

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');

  // Use the custom hook for categories and subcategories
  const {
    categories,
    subcategoryMappings,
    loading,
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

  // Handle category and subcategory operations using our custom hook
  const handleAddCategory = async (name: string) => {
    try {
      await addCategory(name);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await updateCategory(id, name);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleAddSubcategory = async (categoryId: string, name: string) => {
    try {
      await addSubcategory(categoryId, name);
    } catch (error) {
      console.error("Error adding subcategory:", error);
    }
  };

  const handleUpdateSubcategory = async (categoryId: string, id: string, name: string) => {
    try {
      await updateSubcategory(categoryId, id, name);
    } catch (error) {
      console.error("Error updating subcategory:", error);
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, id: string) => {
    try {
      await deleteSubcategory(categoryId, id);
    } catch (error) {
      console.error("Error deleting subcategory:", error);
    }
  };

  // Wait for categories to load
  if (loading) {
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
            Manage incident categories and subcategories
          </p>
        </div>

        <IncidentRelatedConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categories={categories}
          addCategory={handleAddCategory}
          updateCategory={handleUpdateCategory}
          deleteCategory={handleDeleteCategory}
          subcategoryMappings={subcategoryMappings}
          addSubcategory={handleAddSubcategory}
          updateSubcategory={handleUpdateSubcategory}
          deleteSubcategory={handleDeleteSubcategory}
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
