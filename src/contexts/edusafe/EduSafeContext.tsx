import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useEduSafeResourcesList,
  useAddEduSafeResource,
  useUpdateEduSafeResource,
  useDeleteEduSafeResource,
  EduSafeResourceFetchFilters,
} from '@/hooks/edusafe/useEduSafeResourceQueries';

interface EduSafeContextType {
  resources: EduSafeResource[];
  totalCount: number;
  addResource: (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType' | 'resourceType'>) => Promise<void>;
  updateResource: (id: string, updatedResource: Partial<Omit<EduSafeResource, 'file'>> & { file?: File }) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  getResourceById: (id: string) => EduSafeResource | undefined;
  downloadResource: (resource: EduSafeResource) => void;
  getMyResources: () => EduSafeResource[];
  getSaasResources: () => EduSafeResource[];
  loading: boolean;
  refreshResources: (searchQuery?: string, page?: number, limit?: number, filters?: EduSafeResourceFetchFilters) => Promise<void>;
}

const EduSafeContext = createContext<EduSafeContextType | undefined>(undefined);

export const useEduSafe = () => {
  const context = useContext(EduSafeContext);
  if (!context) {
    throw new Error('useEduSafe must be used within an EduSafeProvider');
  }
  return context;
};

interface EduSafeListParams {
  searchQuery?: string;
  page?: number;
  limit?: number;
  filters?: EduSafeResourceFetchFilters;
}

export const EduSafeProvider: React.FC<{ children: React.ReactNode; skipInitialFetch?: boolean }> = ({ children, skipInitialFetch = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [listParams, setListParams] = useState<EduSafeListParams>({});
  const [initiated, setInitiated] = useState(!skipInitialFetch);
  const noClientIdToastShownRef = useRef(false);
  const lastQueryErrorRef = useRef<unknown>(null);

  // Check if we're in a client context (non-backoffice)
  const isClientContext = !location.pathname.startsWith('/backoffice');
  const clientTypeId = user?.client?.client_type?.id || user?.clientType?.id;

  const query = useEduSafeResourcesList({
    clientId: user?.clientId ?? null,
    isClientContext,
    clientTypeId,
    clientName: user?.client?.name,
    searchQuery: listParams.searchQuery,
    page: listParams.page,
    limit: listParams.limit,
    category: listParams.filters?.category,
    ownerType: listParams.filters?.ownerType,
    enabled: initiated,
  });

  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;

  const resources = query.data?.resources ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  // With skipInitialFetch, the query stays disabled until the page's own effect
  // calls refreshResources — until then query.isFetching is false, which would
  // otherwise render as "no resources" instead of a loading state.
  const loading = !initiated || query.isFetching;

  // Wrong concept previously: a missing client context silently returned an empty
  // list with only a console.log. Surface it to the user instead — and never call
  // Supabase for it (the query above stays disabled while there is no client id).
  useEffect(() => {
    if (initiated && !user?.clientId) {
      if (!noClientIdToastShownRef.current) {
        noClientIdToastShownRef.current = true;
        console.warn('No client ID available, skipping resource fetch');
        toast.error('Unable to load resources: no client context found');
      }
    } else {
      noClientIdToastShownRef.current = false;
    }
  }, [initiated, user?.clientId]);

  useEffect(() => {
    if (query.isError && query.error !== lastQueryErrorRef.current) {
      lastQueryErrorRef.current = query.error;
      console.error('Error fetching resources:', query.error);
      toast.error('Failed to load resources');
    }
  }, [query.isError, query.error]);

  const addResourceMutation = useAddEduSafeResource();
  const updateResourceMutation = useUpdateEduSafeResource();
  const deleteResourceMutation = useDeleteEduSafeResource();

  const addResource = async (resource: Omit<EduSafeResource, 'id' | 'uploadDate' | 'uploaderId' | 'uploaderName' | 'ownerType' | 'resourceType'>) => {
    try {
      const clientId = user?.role === 'saas_owner' ? null : user?.clientId ?? null;

      await addResourceMutation.mutateAsync({
        client_id: clientId,
        resource: {
          title: resource.title,
          description: resource.description,
          category: resource.category,
          tags: resource.tags,
          uploaderId: user?.id,
          file: { url: resource.document_url || resource.file?.base64 },
        },
      });

      toast.success('Resource added successfully');
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
        if (updatedResource.youtube_link !== undefined) {
          formData.append('youtube_link', updatedResource.youtube_link || '');
        }

        await updateResourceMutation.mutateAsync({ formData });
        return;
      }

      // If no file, update metadata only using the edge function with query params
      await updateResourceMutation.mutateAsync({
        body: {
          id,
          client_id: user.clientId,
          title: updatedResource.title,
          description: updatedResource.description,
          category: updatedResource.category,
          tags: updatedResource.tags,
          youtube_link: updatedResource.youtube_link,
        },
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
      throw error;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      await deleteResourceMutation.mutateAsync({ id, client_id: user?.clientId });
      toast.success('Resource deleted successfully');
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
      const rawUrl = resource.document_url;

      if (!rawUrl) {
        toast.error('No file available to download');
        return;
      }

      // Derive a clean filename from the URL or title
      const urlFilename = rawUrl.split('?')[0].split('/').pop();
      const filename = urlFilename && urlFilename.includes('.')
        ? decodeURIComponent(urlFilename)
        : resource.file?.name || `${resource.title}.pdf`;

      // Always download via blob so the `download` attribute is honoured.
      // Browsers silently ignore `download` on cross-origin URLs, which causes
      // them to open the file in a new tab instead of saving it.
      const getBlob = async (): Promise<Blob> => {
        // Try Supabase SDK first (handles auth, works for private buckets)
        try {
          const urlObj = new URL(rawUrl);
          const pathMatch = urlObj.pathname.match(
            /\/storage\/v1\/object\/(?:public|sign)\/edusafe-resources\/(.+)/
          );
          if (pathMatch?.[1]) {
            const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);
            const { data, error } = await supabase.storage
              .from('edusafe-resources')
              .download(filePath);
            if (!error && data) return data;
          }

          // Relative path fallback: "edusafe-resources/client/file.pdf"
          const relMatch = rawUrl.replace(/^\//, '').match(/^edusafe-resources\/(.+)/);
          if (relMatch?.[1]) {
            const filePath = decodeURIComponent(relMatch[1].split('?')[0]);
            const { data, error } = await supabase.storage
              .from('edusafe-resources')
              .download(filePath);
            if (!error && data) return data;
          }
        } catch {
          // rawUrl is not an absolute URL — fall through
        }

        // Last resort: plain fetch (works for public URLs)
        const res = await fetch(rawUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      };

      const blob = await getBlob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Delay revocation so the browser has time to start the download
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
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

  const refreshResources = useCallback(async (
    searchQuery?: string,
    page?: number,
    limit?: number,
    filters?: EduSafeResourceFetchFilters
  ) => {
    setInitiated(true);

    // No-arg calls (after upload/edit/delete helpers) keep the current list filters
    if (
      searchQuery === undefined &&
      page === undefined &&
      limit === undefined &&
      filters === undefined
    ) {
      await refetchRef.current();
      return;
    }

    setListParams({ searchQuery, page, limit, filters });
  }, []);

  const value = {
    resources,
    totalCount,
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
