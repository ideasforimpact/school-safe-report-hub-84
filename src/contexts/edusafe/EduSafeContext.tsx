import React, { createContext, useContext, useState, useEffect } from 'react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EduSafeContextType {
  resources: EduSafeResource[];
  addResource: (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>) => Promise<void>;
  updateResource: (id: string, updatedResource: Partial<EduSafeResource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  getResourceById: (id: string) => EduSafeResource | undefined;
  downloadResource: (resource: EduSafeResource) => void;
  getMyResources: () => EduSafeResource[];
  getSaasResources: () => EduSafeResource[];
  loading: boolean;
  refreshResources: () => Promise<void>;
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
  const [resources, setResources] = useState<EduSafeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('edusafe_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database records to EduSafeResource format
      const transformedResources: EduSafeResource[] = (data || []).map(record => ({
        id: record.id,
        title: record.title,
        description: record.description || '',
        category: record.category as any,
        tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
        uploadDate: record.created_at,
        uploaderId: record.uploaded_by || 'unknown',
        uploaderName: 'User', // We'll need to fetch this from users table if needed
        ownerType: record.client_id ? 'school' : 'saas',
        clientId: record.client_id,
        file: {
          id: `file-${record.id}`,
          name: record.title,
          type: 'application/pdf', // Default type, could be enhanced
          size: 0, // Not stored in DB
          base64: record.document_url
        }
      }));

      setResources(transformedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const addResource = async (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType'>) => {
    try {
      const { data, error } = await supabase
        .from('edusafe_resources')
        .insert({
          title: resource.title,
          description: resource.description,
          category: resource.category,
          tags: resource.tags,
          document_url: resource.file.base64,
          uploaded_by: user?.id,
          client_id: user?.role === 'saas_owner' ? null : user?.clientId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Resource added successfully');
      await fetchResources(); // Refresh the list
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
      throw error;
    }
  };

  const updateResource = async (id: string, updatedResource: Partial<EduSafeResource>) => {
    try {
      const updateData: any = {};
      
      if (updatedResource.title !== undefined) updateData.title = updatedResource.title;
      if (updatedResource.description !== undefined) updateData.description = updatedResource.description;
      if (updatedResource.category !== undefined) updateData.category = updatedResource.category;
      if (updatedResource.tags !== undefined) updateData.tags = updatedResource.tags;

      const { error } = await supabase
        .from('edusafe_resources')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource updated successfully');
      await fetchResources(); // Refresh the list
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
      throw error;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('edusafe_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource deleted successfully');
      await fetchResources(); // Refresh the list
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
      throw error;
    }
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

  const refreshResources = async () => {
    await fetchResources();
  };

  const value = {
    resources,
    addResource,
    updateResource,
    deleteResource,
    getResourceById,
    downloadResource,
    getMyResources,
    getSaasResources,
    loading,
    refreshResources
  };

  return (
    <EduSafeContext.Provider value={value}>
      {children}
    </EduSafeContext.Provider>
  );
};
