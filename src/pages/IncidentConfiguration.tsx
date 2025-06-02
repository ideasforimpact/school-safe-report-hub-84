import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import IncidentConfigurationContent from '@/components/incident-configuration/IncidentConfigurationContent';
import { useCategoryManagement } from '@/hooks/config/useCategoryManagement';
import { initialCategories, initialSubcategories, initialLocations, initialFacilities, initialDesignations, initialCampuses, initialClasses, initialSections } from '@/contexts/initialData';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';
import { CampusItem, ClassItem, SectionItem } from '@/contexts/types';

// Add type conversion helper
const convertSubcategoryMappings = (mappings: any): Record<string, SubcategoryItem[]> => {
  const converted: Record<string, SubcategoryItem[]> = {};
  Object.keys(mappings).forEach(key => {
    converted[key] = mappings[key].map((item: any) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId || key // Ensure categoryId is present
    }));
  });
  return converted;
};

const IncidentConfiguration = () => {
  // Local state for categories, subcategories, locations, facilities, and designations
  const [categories, setCategories] = useState<ConfigItem[]>(initialCategories);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(initialSubcategories);
  const [locations, setLocations] = useState<ConfigItem[]>(initialLocations);
  const [facilities, setFacilities] = useState<ConfigItem[]>(initialFacilities);
  const [designations, setDesignations] = useState<ConfigItem[]>(initialDesignations);
  const [campuses, setCampuses] = useState<CampusItem[]>(initialCampuses);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [sections, setSections] = useState<SectionItem[]>(initialSections);

  // Use custom hook for category and subcategory management
  const {
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useCategoryManagement(categories, subcategoryMappings);

  // State and handlers for locations
  const addLocation = useCallback((name: string) => {
    const newLocation = { id: Date.now().toString(), name };
    setLocations(prev => [...prev, newLocation]);
  }, []);

  const updateLocation = useCallback((id: string, name: string) => {
    setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, name } : loc));
  }, []);

  const deleteLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  }, []);

  // State and handlers for facilities
  const addFacility = useCallback((name: string) => {
    const newFacility = { id: Date.now().toString(), name };
    setFacilities(prev => [...prev, newFacility]);
  }, []);

  const updateFacility = useCallback((id: string, name: string) => {
    setFacilities(prev => prev.map(fac => fac.id === id ? { ...fac, name } : fac));
  }, []);

  const deleteFacility = useCallback((id: string) => {
    setFacilities(prev => prev.filter(fac => fac.id !== id));
  }, []);

  // State and handlers for designations
  const addDesignation = useCallback((name: string) => {
    const newDesignation = { id: Date.now().toString(), name };
    setDesignations(prev => [...prev, newDesignation]);
  }, []);

  const updateDesignation = useCallback((id: string, name: string) => {
    setDesignations(prev => prev.map(des => des.id === id ? { ...des, name } : des));
  }, []);

  const deleteDesignation = useCallback((id: string) => {
    setDesignations(prev => prev.filter(des => des.id !== id));
  }, []);

  // State and handlers for campuses
  const addCampus = useCallback((name: string) => {
    const newCampus = { id: Date.now().toString(), name };
    setCampuses(prev => [...prev, newCampus]);
  }, []);

  const updateCampus = useCallback((id: string, name: string) => {
    setCampuses(prev => prev.map(campus => campus.id === id ? { ...campus, name } : campus));
  }, []);

  const deleteCampus = useCallback((id: string) => {
    setCampuses(prev => prev.filter(campus => campus.id !== id));
  }, []);

  // State and handlers for classes
  const addClass = useCallback((campusId: string, name: string) => {
    const newClass = { id: Date.now().toString(), name, campusId };
    setClasses(prev => [...prev, newClass]);
  }, []);

  const updateClass = useCallback((id: string, campusId: string, name: string) => {
    setClasses(prev => prev.map(cls => cls.id === id ? { ...cls, name, campusId } : cls));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
  }, []);

  // State and handlers for sections
  const addSection = useCallback((classId: string, name: string) => {
    const newSection = { id: Date.now().toString(), name, classId };
    setSections(prev => [...prev, newSection]);
  }, []);

  const updateSection = useCallback((id: string, classId: string, name: string) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, name, classId } : sec));
  }, []);

  const deleteSection = useCallback((id: string) => {
    setSections(prev => prev.filter(sec => sec.id !== id));
  }, []);

  // Handler to update subcategory mappings
  const handleSubcategoryUpdate = (updatedMappings: any) => {
    const convertedMappings = convertSubcategoryMappings(updatedMappings);
    setSubcategoryMappings(convertedMappings);
  };

  useEffect(() => {
    setCategories(initialCategories);
    setSubcategoryMappings(initialSubcategories);
    setLocations(initialLocations);
    setFacilities(initialFacilities);
    setDesignations(initialDesignations);
    setCampuses(initialCampuses);
    setClasses(initialClasses);
    setSections(initialSections);
  }, []);

  return (
    <Layout>
      <div className="container max-w-7xl py-6">
        <IncidentConfigurationContent
          categories={categories}
          addCategory={addCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          subcategoryMappings={convertSubcategoryMappings(subcategoryMappings)}
          addSubcategory={addSubcategory}
          updateSubcategory={updateSubcategory}
          deleteSubcategory={deleteSubcategory}
          onSubcategoryUpdate={handleSubcategoryUpdate}
          locations={locations}
          addLocation={addLocation}
          updateLocation={updateLocation}
          deleteLocation={deleteLocation}
          facilities={facilities}
          addFacility={addFacility}
          updateFacility={updateFacility}
          deleteFacility={deleteFacility}
          designations={designations}
          addDesignation={addDesignation}
          updateDesignation={updateDesignation}
          deleteDesignation={deleteDesignation}
          campuses={campuses}
          addCampus={addCampus}
          updateCampus={updateCampus}
          deleteCampus={deleteCampus}
          classes={classes}
          addClass={addClass}
          updateClass={updateClass}
          deleteClass={deleteClass}
          sections={sections}
          addSection={addSection}
          updateSection={updateSection}
          deleteSection={deleteSection}
        />
      </div>
    </Layout>
  );
};

export default IncidentConfiguration;
