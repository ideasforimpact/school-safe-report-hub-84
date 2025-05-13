
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialResources } from './initialData';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { toast } from 'sonner';

interface EduSafeContextType {
  resources: EduSafeResource[];
  addResource: (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>) => void;
  updateResource: (id: string, updatedResource: Partial<EduSafeResource>) => void;
  deleteResource: (id: string) => void;
  getResourceById: (id: string) => EduSafeResource | undefined;
  downloadResource: (resource: EduSafeResource) => void;
  getMyResources: () => EduSafeResource[];
  getSaasResources: () => EduSafeResource[];
}

const EduSafeContext = createContext<EduSafeContextType | undefined>(undefined);

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

  useEffect(() => {
    // Load resources from localStorage if available
    const storedResources = localStorage.getItem('edusafe_resources');
    if (storedResources) {
      setResources(JSON.parse(storedResources));
    }
  }, []);

  useEffect(() => {
    // Save resources to localStorage when they change
    localStorage.setItem('edusafe_resources', JSON.stringify(resources));
  }, [resources]);

  const addResource = (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>) => {
    const newResource: EduSafeResource = {
      ...resource,
      id: `resource_${Date.now()}`,
      uploadDate: new Date().toISOString(),
      uploaderId: user?.id || 'unknown',
      uploaderName: user ? formatUserFullName(user) : 'Unknown User',
      ownerType: user?.role === 'saas_owner' ? 'saas' : 'school',
      clientId: user?.clientId
    };

    setResources(prev => [...prev, newResource]);
    toast.success('Resource added successfully');
  };

  const updateResource = (id: string, updatedResource: Partial<EduSafeResource>) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === id ? { ...resource, ...updatedResource } : resource
      )
    );
    toast.success('Resource updated successfully');
  };

  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(resource => resource.id !== id));
    toast.success('Resource deleted successfully');
  };

  const getResourceById = (id: string) => {
    return resources.find(resource => resource.id === id);
  };
  
  const downloadResource = (resource: EduSafeResource) => {
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // Set link attributes
      link.href = resource.file.base64;
      link.download = resource.file.name;
      
      // Append to document
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download resource');
      console.error('Download error:', error);
    }
  };
  
  const getMyResources = () => {
    if (!user) return [];
    
    if (user.role === 'saas_owner') {
      return resources.filter(r => r.ownerType === 'saas');
    }
    
    return resources.filter(r => 
      r.ownerType === 'school' && r.clientId === user.clientId
    );
  };
  
  const getSaasResources = () => {
    return resources.filter(r => r.ownerType === 'saas');
  };

  const value = {
    resources,
    addResource,
    updateResource,
    deleteResource,
    getResourceById,
    downloadResource,
    getMyResources,
    getSaasResources
  };

  return (
    <EduSafeContext.Provider value={value}>
      {children}
    </EduSafeContext.Provider>
  );
};
