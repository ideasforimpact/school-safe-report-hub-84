import { useState, useEffect } from 'react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';

export function useConfigManagement(
  initialCategories: ConfigItem[],
  initialSubcategories: Record<string, SubcategoryItem[]>,
  initialLocations: ConfigItem[],
  initialFacilities: ConfigItem[],
  initialDesignations: ConfigItem[] = [],
  initialClasses: ConfigItem[] = [],
  initialSections: ConfigItem[] = []
) {
  // Configuration state
  const [categories, setCategories] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(() => {
    const saved = localStorage.getItem('subcategories');
    return saved ? JSON.parse(saved) : initialSubcategories;
  });

  const [locations, setLocations] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('locations');
    return saved ? JSON.parse(saved) : initialLocations;
  });

  const [facilities, setFacilities] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('facilities');
    return saved ? JSON.parse(saved) : initialFacilities;
  });

  const [designations, setDesignations] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('designations');
    return saved ? JSON.parse(saved) : initialDesignations;
  });
  
  // Add classes and sections state
  const [classes, setClasses] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('classes');
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [sections, setSections] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('sections');
    return saved ? JSON.parse(saved) : initialSections;
  });

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('subcategories', JSON.stringify(subcategoryMappings));
  }, [subcategoryMappings]);

  useEffect(() => {
    localStorage.setItem('locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('facilities', JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem('designations', JSON.stringify(designations));
  }, [designations]);
  
  // Add effects for classes and sections
  useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('sections', JSON.stringify(sections));
  }, [sections]);

  // Categories management
  const addCategory = (name: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name
    };
    setCategories(prev => [...prev, newCategory]);
    // Initialize empty subcategory list for this category
    setSubcategoryMappings(prev => ({
      ...prev,
      [newCategory.id]: []
    }));
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Remove subcategories for this category
    const { [id]: _, ...rest } = subcategoryMappings;
    setSubcategoryMappings(rest);
  };

  // Subcategories management
  const addSubcategory = (categoryId: string, name: string) => {
    const newSubcategory = {
      id: `${categoryId}-${Date.now()}`,
      name
    };
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newSubcategory]
    }));
  };

  const updateSubcategory = (categoryId: string, id: string, name: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(subcat =>
        subcat.id === id ? { ...subcat, name } : subcat
      )
    }));
  };

  const deleteSubcategory = (categoryId: string, id: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(subcat => subcat.id !== id)
    }));
  };

  // Locations management
  const addLocation = (name: string) => {
    const newLocation = {
      id: Date.now().toString(),
      name
    };
    setLocations(prev => [...prev, newLocation]);
  };

  const updateLocation = (id: string, name: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, name } : loc
    ));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  // Facilities management
  const addFacility = (name: string) => {
    const newFacility = {
      id: Date.now().toString(),
      name
    };
    setFacilities(prev => [...prev, newFacility]);
  };

  const updateFacility = (id: string, name: string) => {
    setFacilities(prev => prev.map(fac => 
      fac.id === id ? { ...fac, name } : fac
    ));
  };

  const deleteFacility = (id: string) => {
    setFacilities(prev => prev.filter(fac => fac.id !== id));
  };

  // Designations management
  const addDesignation = (name: string) => {
    const newDesignation = {
      id: Date.now().toString(),
      name
    };
    setDesignations(prev => [...prev, newDesignation]);
  };

  const updateDesignation = (id: string, name: string) => {
    setDesignations(prev => prev.map(designation => 
      designation.id === id ? { ...designation, name } : designation
    ));
  };

  const deleteDesignation = (id: string) => {
    setDesignations(prev => prev.filter(designation => designation.id !== id));
  };

  // Classes management
  const addClass = (name: string) => {
    const newClass = {
      id: Date.now().toString(),
      name
    };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: string, name: string) => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, name } : cls
    ));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
  };

  // Sections management
  const addSection = (name: string) => {
    const newSection = {
      id: Date.now().toString(),
      name
    };
    setSections(prev => [...prev, newSection]);
  };

  const updateSection = (id: string, name: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, name } : section
    ));
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  return {
    // State
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    classes,
    sections,
    // Category methods
    addCategory,
    updateCategory,
    deleteCategory,
    // Subcategory methods
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    // Location methods
    addLocation,
    updateLocation,
    deleteLocation,
    // Facility methods
    addFacility,
    updateFacility,
    deleteFacility,
    // Designation methods
    addDesignation,
    updateDesignation,
    deleteDesignation,
    // Class methods
    addClass,
    updateClass,
    deleteClass,
    // Section methods
    addSection,
    updateSection,
    deleteSection
  };
}
