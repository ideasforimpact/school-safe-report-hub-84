
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');
  
  const { 
    categories, 
    addCategory, 
    deleteCategory, 
    updateCategory,
    subcategoryMappings, 
    addSubcategory, 
    deleteSubcategory, 
    updateSubcategory,
    locations,
    addLocation,
    deleteLocation,
    updateLocation,
    facilities,
    addFacility,
    deleteFacility,
    updateFacility
  } = useIncidents();

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddCategory = (name: string) => {
    addCategory(name);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    updateCategory(id, name);
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    addSubcategory(categoryId, name);
  };

  const handleUpdateSubcategory = (categoryId: string, id: string, name: string) => {
    updateSubcategory(categoryId, id, name);
  };

  const handleDeleteSubcategory = (categoryId: string, id: string) => {
    deleteSubcategory(categoryId, id);
  };

  const handleAddLocation = (name: string) => {
    addLocation(name);
  };

  const handleUpdateLocation = (id: string, name: string) => {
    updateLocation(id, name);
  };

  const handleDeleteLocation = (id: string) => {
    deleteLocation(id);
  };

  const handleAddFacility = (name: string) => {
    addFacility(name);
  };

  const handleUpdateFacility = (id: string, name: string) => {
    updateFacility(id, name);
  };

  const handleDeleteFacility = (id: string) => {
    deleteFacility(id);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Incident Related Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage incident categories, subcategories, locations, and facilities
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
          locations={locations}
          addLocation={handleAddLocation}
          updateLocation={handleUpdateLocation}
          deleteLocation={handleDeleteLocation}
          facilities={facilities}
          addFacility={handleAddFacility}
          updateFacility={handleUpdateFacility}
          deleteFacility={handleDeleteFacility}
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
