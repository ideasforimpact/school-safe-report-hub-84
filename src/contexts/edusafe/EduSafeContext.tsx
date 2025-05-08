
import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileItem } from '@/types/fileTypes';
import { EduSafeResource, ResourceCategory } from '@/types/eduSafeTypes';
import { initialResources } from './initialData';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from '@/components/ui/sonner';

interface EduSafeContextType {
  resources: EduSafeResource[];
  addResource: (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>, file: FileItem) => void;
  updateResource: (id: string, updates: Partial<Omit<EduSafeResource, 'id' | 'uploaderId' | 'uploaderName' | 'ownerType'>>) => void;
  deleteResource: (id: string) => void;
  getResourceById: (id: string) => EduSafeResource | undefined;
  getResourcesByCategory: (category: ResourceCategory) => EduSafeResource[];
  getMyResources: () => EduSafeResource[];
  getSaasResources: () => EduSafeResource[];
  downloadResource: (resource: EduSafeResource) => void;
}

const EduSafeContext = createContext<EduSafeContextType | null>(null);

export const useEduSafe = () => {
  const context = useContext(EduSafeContext);
  if (!context) {
    throw new Error('useEduSafe must be used within an EduSafeProvider');
  }
  return context;
};

export const EduSafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<EduSafeResource[]>(initialResources);
  const { user } = useAuth();

  const addResource = (
    resourceData: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>, 
    file: FileItem
  ) => {
    if (!user) {
      toast.error('You must be logged in to add resources');
      return;
    }

    const ownerType = user.role === 'saas_owner' ? 'saas' : 'school';
    
    const newResource: EduSafeResource = {
      ...resourceData,
      id: uuidv4(),
      file,
      uploadDate: new Date().toISOString(),
      uploaderId: user.id,
      uploaderName: user.name,
      ownerType,
      clientId: user.clientId
    };

    setResources([...resources, newResource]);
    toast.success('Resource added successfully');
  };

  const updateResource = (id: string, updates: Partial<Omit<EduSafeResource, 'id' | 'uploaderId' | 'uploaderName' | 'ownerType'>>) => {
    if (!user) {
      toast.error('You must be logged in to update resources');
      return;
    }

    const resource = resources.find(r => r.id === id);
    if (!resource) {
      toast.error('Resource not found');
      return;
    }

    // Check permissions - only owner or SaaS admin can update
    if (resource.uploaderId !== user.id && user.role !== 'saas_owner') {
      toast.error('You do not have permission to update this resource');
      return;
    }

    const updatedResources = resources.map(resource => 
      resource.id === id ? { ...resource, ...updates } : resource
    );
    
    setResources(updatedResources);
    toast.success('Resource updated successfully');
  };

  const deleteResource = (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete resources');
      return;
    }

    const resource = resources.find(r => r.id === id);
    if (!resource) {
      toast.error('Resource not found');
      return;
    }

    // Check permissions - only owner or SaaS admin can delete
    if (resource.uploaderId !== user.id && user.role !== 'saas_owner') {
      toast.error('You do not have permission to delete this resource');
      return;
    }

    const updatedResources = resources.filter(resource => resource.id !== id);
    setResources(updatedResources);
    toast.success('Resource deleted successfully');
  };

  const getResourceById = (id: string) => {
    return resources.find(resource => resource.id === id);
  };

  const getResourcesByCategory = (category: ResourceCategory) => {
    return resources.filter(resource => {
      // If user is a client, only show their resources or SaaS resources
      if (user?.role !== 'saas_owner' && user?.clientId) {
        return (resource.category === category) && 
               (resource.ownerType === 'saas' || resource.clientId === user.clientId);
      }
      
      return resource.category === category;
    });
  };

  const getMyResources = () => {
    if (!user) return [];
    
    return resources.filter(resource => {
      if (user.role === 'saas_owner') {
        return resource.ownerType === 'saas';
      } else {
        return resource.clientId === user.clientId && resource.ownerType === 'school';
      }
    });
  };

  const getSaasResources = () => {
    return resources.filter(resource => resource.ownerType === 'saas');
  };

  const downloadResource = (resource: EduSafeResource) => {
    try {
      // Create a link element to trigger download
      const link = document.createElement('a');
      link.href = resource.file.base64;
      link.download = resource.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${resource.title}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download the resource');
    }
  };

  const value = {
    resources,
    addResource,
    updateResource,
    deleteResource,
    getResourceById,
    getResourcesByCategory,
    getMyResources,
    getSaasResources,
    downloadResource
  };

  return (
    <EduSafeContext.Provider value={value}>
      {children}
    </EduSafeContext.Provider>
  );
};
