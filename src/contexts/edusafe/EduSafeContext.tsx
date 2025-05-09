
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialResources } from './initialData';
import { EducationalResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';

interface EduSafeContextType {
  resources: EducationalResource[];
  addResource: (resource: Omit<EducationalResource, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  updateResource: (id: string, updatedResource: Partial<EducationalResource>) => void;
  deleteResource: (id: string) => void;
  getResourceById: (id: string) => EducationalResource | undefined;
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
  const [resources, setResources] = useState<EducationalResource[]>(initialResources);
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

  const addResource = (resource: Omit<EducationalResource, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const newResource: EducationalResource = {
      ...resource,
      id: `resource_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user ? formatUserFullName(user) : 'Unknown User',
    };

    setResources(prev => [...prev, newResource]);
  };

  const updateResource = (id: string, updatedResource: Partial<EducationalResource>) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === id ? { ...resource, ...updatedResource } : resource
      )
    );
  };

  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(resource => resource.id !== id));
  };

  const getResourceById = (id: string) => {
    return resources.find(resource => resource.id === id);
  };

  const value = {
    resources,
    addResource,
    updateResource,
    deleteResource,
    getResourceById
  };

  return (
    <EduSafeContext.Provider value={value}>
      {children}
    </EduSafeContext.Provider>
  );
};
