
import { FileItem } from './fileTypes';

export type ResourceCategory = 'posters' | 'procedures' | 'guidelines' | 'forms' | 'other';

export interface EduSafeResource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  uploadDate: string;
  uploaderId: string;
  uploaderName: string;
  ownerType: 'school' | 'saas';
  clientId?: string;
  resourceType: 'Organisational Resource' | 'Global Resource';
  document_url: string; // Direct URL to the file in Supabase storage
  file?: FileItem; // Optional for backward compatibility
}
