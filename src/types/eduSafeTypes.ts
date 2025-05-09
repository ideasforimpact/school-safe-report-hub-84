
import { FileItem } from './fileTypes';

export type ResourceCategory = 'posters' | 'procedures' | 'guidelines' | 'forms' | 'other';

export interface EduSafeResource {
  id: string;
  title: string;
  description: string;
  file: FileItem;
  category: ResourceCategory;
  tags: string[];
  uploadDate: string;
  uploaderId: string;
  uploaderName: string;
  ownerType: 'saas' | 'school';
  clientId?: string; // Optional, only present for school-owned resources
}

// Ensure backward compatibility with existing code
export type EducationalResource = EduSafeResource;
