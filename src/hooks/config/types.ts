
import { ConfigItem, SubcategoryItem, SectionItem, ClassItem, CampusItem } from '@/contexts/types';

export interface ConfigState {
  categories: ConfigItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  locations: ConfigItem[];
  facilities: ConfigItem[];
  designations: ConfigItem[];
  campuses: CampusItem[];
  classes: ClassItem[];
  sections: SectionItem[];
}

export interface ConfigFunctions {
  // Category methods
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  // Subcategory methods
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  // Location methods
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  // Facility methods
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
  // Designation methods
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
  // Campus methods
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  // Class methods
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
  // Section methods
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
}

export type ConfigManagement = ConfigState & ConfigFunctions;
