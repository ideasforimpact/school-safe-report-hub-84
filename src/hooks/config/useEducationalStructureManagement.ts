
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
  const addCampus = (name: string) => {
    const newCampus = {
      id: Date.now().toString(),
      name
    };
    setCampuses(prev => [...prev, newCampus]);
  };

  const updateCampus = (id: string, name: string) => {
    setCampuses(prev => prev.map(campus => 
      campus.id === id ? { ...campus, name } : campus
    ));
  };

  const deleteCampus = (id: string) => {
    setCampuses(prev => prev.filter(campus => campus.id !== id));
    // Remove classes associated with this campus
    setClasses(prev => prev.filter(cls => cls.campusId !== id));
  };

  // Classes management
  const addClass = (campusId: string, name: string) => {
    const newClass = {
      id: Date.now().toString(),
      name,
      campusId
    };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: string, campusId: string, name: string) => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, name, campusId } : cls
    ));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
    // Remove sections associated with this class
    setSections(prev => prev.filter(section => section.classId !== id));
  };

  // Sections management
  const addSection = (classId: string, name: string) => {
    const newSection = {
      id: Date.now().toString(),
      name,
      classId
    };
    setSections(prev => [...prev, newSection]);
  };

  const updateSection = (id: string, classId: string, name: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, name, classId } : section
    ));
  };

  const deleteSection = (id: string) => {
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
