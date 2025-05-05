
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
  const addCampus = (name: string): void => {
    const newCampus: CampusItem = {
      id: Date.now().toString(),
      name
    };
    setCampuses(prevCampuses => [...prevCampuses, newCampus]);
  };

  const updateCampus = (id: string, name: string): void => {
    setCampuses(prevCampuses => prevCampuses.map(campus => 
      campus.id === id ? { ...campus, name } : campus
    ));
  };

  const deleteCampus = (id: string): void => {
    setCampuses(prevCampuses => prevCampuses.filter(campus => campus.id !== id));
    // Remove classes associated with this campus
    setClasses(prevClasses => prevClasses.filter(cls => cls.campusId !== id));
  };

  // Classes management
  const addClass = (campusId: string, name: string): void => {
    const newClass: ClassItem = {
      id: Date.now().toString(),
      name,
      campusId
    };
    setClasses(prevClasses => [...prevClasses, newClass]);
  };

  const updateClass = (id: string, campusId: string, name: string): void => {
    setClasses(prevClasses => prevClasses.map(cls => 
      cls.id === id ? { ...cls, name, campusId } : cls
    ));
  };

  const deleteClass = (id: string): void => {
    setClasses(prevClasses => prevClasses.filter(cls => cls.id !== id));
    // Remove sections associated with this class
    setSections(prevSections => prevSections.filter(section => section.classId !== id));
  };

  // Sections management
  const addSection = (classId: string, name: string): void => {
    const newSection: SectionItem = {
      id: Date.now().toString(),
      name,
      classId
    };
    setSections(prevSections => [...prevSections, newSection]);
  };

  const updateSection = (id: string, classId: string, name: string): void => {
    setSections(prevSections => prevSections.map(section => 
      section.id === id ? { ...section, name, classId } : section
    ));
  };

  const deleteSection = (id: string): void => {
    setSections(prevSections => prevSections.filter(section => section.id !== id));
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
