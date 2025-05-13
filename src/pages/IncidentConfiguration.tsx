
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { IncidentRelatedConfig } from './configuration/IncidentRelatedConfig';
import { toast } from '@/components/ui/sonner';
import { ConfigItem } from '@/contexts/types';

const IncidentConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('categories');
  
  const { 
    categories: contextCategories, 
    addCategory: contextAddCategory, 
    deleteCategory: contextDeleteCategory, 
    updateCategory: contextUpdateCategory,
    subcategoryMappings: contextSubcategories, 
    addSubcategory: contextAddSubcategory, 
    deleteSubcategory: contextDeleteSubcategory, 
    updateSubcategory: contextUpdateSubcategory,
    locations: contextLocations,
    addLocation: contextAddLocation,
    deleteLocation: contextDeleteLocation,
    updateLocation: contextUpdateLocation,
    facilities: contextFacilities,
    addFacility: contextAddFacility,
    deleteFacility: contextDeleteFacility,
    updateFacility: contextUpdateFacility,
    campuses: contextCampuses // Get campuses from context
  } = useIncidents();

  // Local state to track changes
  const [categories, setCategories] = useState<ConfigItem[]>(contextCategories);
  const [subcategoryMappings, setSubcategoryMappings] = useState(contextSubcategories);
  const [locations, setLocations] = useState(contextLocations);
  const [facilities, setFacilities] = useState(contextFacilities);
  const [campuses, setCampuses] = useState(contextCampuses); // Add state for campuses

  // Update local state when context changes
  useEffect(() => {
    setCategories(contextCategories);
    setSubcategoryMappings(contextSubcategories);
    setLocations(contextLocations);
    setFacilities(contextFacilities);
    setCampuses(contextCampuses); // Update campuses state when context changes
  }, [contextCategories, contextSubcategories, contextLocations, contextFacilities, contextCampuses]);

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddCategory = (name: string) => {
    try {
      contextAddCategory(name);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = (id: string, name: string) => {
    try {
      contextUpdateCategory(id, name);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      contextDeleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    try {
      contextAddSubcategory(categoryId, name);
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory");
    }
  };

  const handleUpdateSubcategory = (categoryId: string, id: string, name: string) => {
    try {
      contextUpdateSubcategory(categoryId, id, name);
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = (categoryId: string, id: string) => {
    try {
      contextDeleteSubcategory(categoryId, id);
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Failed to delete subcategory");
    }
  };

  const handleAddLocation = (name: string) => {
    try {
      contextAddLocation(name);
      toast.success("Location added successfully");
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleUpdateLocation = (id: string, name: string) => {
    try {
      contextUpdateLocation(id, name);
      toast.success("Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = (id: string) => {
    try {
      contextDeleteLocation(id);
      toast.success("Location deleted successfully");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleAddFacility = (name: string) => {
    try {
      contextAddFacility(name);
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    }
  };

  const handleUpdateFacility = (id: string, name: string) => {
    try {
      contextUpdateFacility(id, name);
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    }
  };

  const handleDeleteFacility = (id: string) => {
    try {
      contextDeleteFacility(id);
      toast.success("Facility deleted successfully");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("Failed to delete facility");
    }
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
          campuses={campuses} // Pass campuses to the IncidentRelatedConfig component
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
