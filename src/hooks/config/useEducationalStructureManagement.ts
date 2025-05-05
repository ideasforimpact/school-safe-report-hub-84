
import { useState } from 'react';
import { SectionItem, ClassItem, CampusItem } from '@/contexts/types';

export function useEducationalStructureManagement(
  initialCampuses: CampusItem[] = [],
  initialClasses: ClassItem[] = [],
  initialSections: SectionItem[] = []
) {
  // Campus, class, and section state
  const [campuses, setCampuses] = useState<CampusItem[]>(initialCampuses);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [sections, setSections] = useState<SectionItem[]>(initialSections);

  // Campus management
  const addCampus = (name: string): CampusItem => {
    const newCampus: CampusItem = {
      id: Date.now().toString(),
      name
    };
    setCampuses(prev => [...prev, newCampus]);
    return newCampus; // Return the newly created campus
  };

  const updateCampus = (id: string, name: string): void => {
    setCampuses(prev => prev.map(campus => 
      campus.id === id ? { ...campus, name } : campus
    ));
  };

  const deleteCampus = (id: string): void => {
    setCampuses(prev => prev.filter(campus => campus.id !== id));
    // Remove classes associated with this campus
    setClasses(prev => prev.filter(cls => cls.campusId !== id));
  };

  // Classes management
  const addClass = (campusId: string, name: string): ClassItem => {
    const newClass: ClassItem = {
      id: Date.now().toString(),
      name,
      campusId
    };
    setClasses(prev => [...prev, newClass]);
    return newClass; // Return the newly created class
  };

  const updateClass = (id: string, campusId: string, name: string): void => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, name, campusId } : cls
    ));
  };

  const deleteClass = (id: string): void => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
    // Remove sections associated with this class
    setSections(prev => prev.filter(section => section.classId !== id));
  };

  // Sections management
  const addSection = (classId: string, name: string): SectionItem => {
    const newSection: SectionItem = {
      id: Date.now().toString(),
      name,
      classId
    };
    setSections(prev => [...prev, newSection]);
    return newSection; // Return the newly created section
  };

  const updateSection = (id: string, classId: string, name: string): void => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, name, classId } : section
    ));
  };

  const deleteSection = (id: string): void => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  return {
    campuses,
    classes,
    sections,
    addCampus,
    updateCampus,
    deleteCampus,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection
  };
}
