import React, { createContext, useContext, useState, useEffect } from 'react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper function to extract filename from document_url
const extractFileNameFromUrl = (url: string | undefined | null, fallbackTitle: string): string => {
  if (!url) return fallbackTitle;
  
  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    // Remove query parameters if any
    let fileName = fileNameWithParams.split('?')[0];
    
    // If we got a meaningful filename (has an extension), use it
    if (fileName && fileName.includes('.')) {
      // Decode URL encoding
      fileName = decodeURIComponent(fileName);
      // Convert underscores back to spaces for better readability (since we sanitize spaces to underscores)
      // But only if it looks like it was sanitized (has underscores and no original spaces)
      // We'll keep underscores as-is to preserve original filenames that had underscores
      return fileName;
    }
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
  }
  
  // Fallback to title if we can't extract a good filename
  return fallbackTitle;
};

interface EduSafeContextType {
  resources: EduSafeResource[];
  addResource: (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType' | 'resourceType'>) => Promise<void>;
  updateResource: (id: string, updatedResource: Partial<Omit<EduSafeResource, 'file'>> & { file?: File }) => Promise<void>;
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
  const location = useLocation();

  const fetchResources = async () => {
    try {
      setLoading(true);
      
      if (!user?.clientId) {
        console.log('No client ID available, skipping fetch');
        setResources([]);
        return;
      }

      // Check if we're in a client context (non-backoffice)
      const isClientContext = !location.pathname.startsWith('/backoffice');
      
      if (isClientContext) {
        // Use the new edge function for client resource fetching
        const { data: resourcesData, error } = await supabase.functions
          .invoke('edusafe-resource-client', {
            body: { 
              action: 'fetch_resources',
              data: { client_id: user.clientId }
            }
          });

        if (error) {
          console.error('Error fetching resources via edge function:', error);
          toast.error('Failed to load resources');
          setResources([]);
          return;
        }

        // Transform the data to match EduSafeResource structure
        const transformedResources: EduSafeResource[] = (resourcesData?.resources || []).map((resource: any) => ({
          id: resource.id,
          title: resource.title,
          description: resource.description || '',
          category: resource.category,
          tags: Array.isArray(resource.tags) ? resource.tags : [],
          uploadDate: resource.uploadDate,
          uploaderId: resource.uploaderId,
          uploaderName: resource.uploaderName || (resource.uploaderId && user?.id === resource.uploaderId
            ? formatUserFullName(user)
            : 'Unknown'),
          ownerType: resource.ownerType,
          clientId: resource.clientId,
          resourceType: resource.resourceType,
          document_url: resource.document_url,
          youtube_link: (resource as any)?.youtube_link as string | undefined,
          file: {
            id: `file-${resource.id}`,
            name: extractFileNameFromUrl(resource.document_url, resource.title),
            type: 'application/pdf',
            size: 0,
            base64: resource.document_url
          }
        }));

        setResources(transformedResources);
      } else {
        // Backoffice context - use existing logic
        // Fetch regular edusafe_resources filtered by client_id
        const { data: regularResources, error: regularError } = await supabase
          .from('edusafe_resources')
          .select('*')
          .eq('client_id', user.clientId)
          .order('created_at', { ascending: false });

        if (regularError) throw regularError;

        // Get client type ID from user data
        const clientTypeId = user?.client?.client_type?.id || user?.clientType?.id;

        // Fetch backoffice resources using the edge function with client_type_id
        let backofficeResources = [];
        if (clientTypeId) {
          const { data: backofficeData, error: backofficeError } = await supabase.functions.invoke('backoffice-edusafe-resource', {
            body: { 
              action: 'list',
              client_type_id: clientTypeId
            }
          });

          if (backofficeError) {
            console.error('Error fetching backoffice resources:', backofficeError);
          } else {
            backofficeResources = backofficeData.resources || [];
          }
        }

        // Transform database records to EduSafeResource format
        const transformedResources: EduSafeResource[] = [];

        // Process regular edusafe_resources
        (regularResources || []).forEach(record => {
          const youtubeLink = (record as any)?.youtube_link as string | undefined;
          transformedResources.push({
            id: record.id,
            title: record.title,
            description: record.description || '',
            category: record.category as any,
            tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
            uploadDate: record.created_at,
            uploaderId: record.uploaded_by || 'unknown',
            uploaderName: formatUserFullName(user),
            ownerType: 'school',
            clientId: record.client_id,
            resourceType: 'Organisational Resource',
            document_url: record.document_url,
            youtube_link: youtubeLink,
            file: {
              id: `file-${record.id}`,
              name: extractFileNameFromUrl(record.document_url, record.title),
              type: 'application/pdf',
              size: 0,
              base64: record.document_url
            }
          });
        });

        // Process backoffice resources (Global Resources)
        backofficeResources.forEach(record => {
          const youtubeLink = (record as any)?.youtube_link as string | undefined;
          transformedResources.push({
            id: `backoffice-${record.id}`,
            title: record.title,
            description: record.description || '',
            category: record.category as any,
            tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
            uploadDate: record.created_at,
            uploaderId: record.uploaded_by || 'unknown',
            uploaderName: 'EduSafe Team',
            ownerType: 'saas',
            clientId: user.clientId, // Use user's client ID for compatibility
            resourceType: 'Global Resource',
            document_url: record.document_url,
            youtube_link: youtubeLink,
            file: {
              id: `file-backoffice-${record.id}`,
              name: extractFileNameFromUrl(record.document_url, record.title),
              type: 'application/pdf',
              size: 0,
              base64: record.document_url
            }
          });
        });

        // Sort all resources by created date
        transformedResources.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );

        console.log(transformedResources,"transformedResources");
        
        setResources(transformedResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.clientId) {
      fetchResources();
    } else {
      // Set loading to false and clear resources when no client ID
      setLoading(false);
      setResources([]);
    }
  }, [user?.clientId]);

  const addResource = async (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType' | 'resourceType'>) => {
    try {
      const { data, error } = await supabase
        .from('edusafe_resources')
        .insert({
          title: resource.title,
          description: resource.description,
          category: resource.category,
          tags: resource.tags,
          document_url: resource.document_url || resource.file?.base64,
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

  const updateResource = async (id: string, updatedResource: Partial<Omit<EduSafeResource, 'file'>> & { file?: File }) => {
    try {
      if (!user?.clientId) {
        throw new Error('No client ID found');
      }

      // If a file is provided, use FormData and call the edge function
      if (updatedResource.file) {
        const formData = new FormData();
        formData.append('file', updatedResource.file);
        formData.append('title', updatedResource.title || '');
        formData.append('description', updatedResource.description || '');
        formData.append('category', updatedResource.category || 'posters');
        formData.append('tags', JSON.stringify(updatedResource.tags || []));
        formData.append('client_id', user.clientId);
        formData.append('resource_id', id);

        const { data, error } = await supabase.functions.invoke('edusafe-resource-upload', {
          method: 'PUT',
          body: formData
        });

        if (error) throw error;
        if (!data.success) {
          throw new Error(data.error || 'Failed to update resource');
        }

        // toast.success('Resource updated successfully');
        await fetchResources(); // Refresh the list
        return;
      }

      // If no file, update metadata only using the edge function with query params
      const { data, error } = await supabase.functions.invoke('edusafe-resource-upload', {
        method: 'PUT',
        body: {
          id: id,
          client_id: user.clientId,
          title: updatedResource.title,
          description: updatedResource.description,
          category: updatedResource.category,
          tags: updatedResource.tags
        }
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Failed to update resource');
      }

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
  
  const downloadResource = async (resource: EduSafeResource) => {
    try {
      let downloadUrl = resource.document_url;
      let filename = `${resource.title}`;

      if (!downloadUrl && resource.file?.base64) {
        // Fallback to base64 if document_url is not available
        downloadUrl = resource.file.base64;
        filename = resource.file.name || `${resource.title}`;
      }

      if (!downloadUrl) {
        toast.error('No file available to download');
        return;
      }

      // Extract filename and extension from URL if it's a document_url
      if (resource.document_url) {
        const urlParts = resource.document_url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          filename = lastPart;
        } else {
          // If no extension in URL, try to determine from content type or default to .pdf
          const fileExtension = resource.document_url.split('.').pop()?.toLowerCase();
          if (fileExtension && ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            filename = `${resource.title}.${fileExtension}`;
          } else {
            filename = `${resource.title}.pdf`;
          }
        }
      } else {
        // For base64 files, use the file name if available
        filename = resource.file?.name || `${resource.title}.pdf`;
      }

      // For Supabase storage URLs, we need to fetch the file as a blob to force download
      if (resource.document_url && resource.document_url.includes('supabase.co')) {
        try {
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Create a link element
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          // Append to document
          document.body.appendChild(link);
          
          // Trigger download
          link.click();
          
                // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
        } catch (fetchError) {
          console.error('Error fetching file:', fetchError);
          // Fallback to direct link if fetch fails
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // For other URLs (like base64), use the original method
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
