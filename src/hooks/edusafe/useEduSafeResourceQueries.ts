import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EduSafeResource, ResourceCategory } from '@/types/eduSafeTypes';
import { supabase } from '@/integrations/supabase/client';

// Helper function to extract filename from document_url
const extractFileNameFromUrl = (url: string | undefined | null, fallbackTitle: string): string => {
  if (!url) return fallbackTitle;

  try {
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    let fileName = fileNameWithParams.split('?')[0];

    if (fileName && fileName.includes('.')) {
      fileName = decodeURIComponent(fileName);
      return fileName;
    }
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
  }

  return fallbackTitle;
};

// ─── Query key factory ────────────────────────────────────────────────────────
export const edusafeResourceKeys = {
  all: ['edusafe-resources'] as const,
  lists: () => [...edusafeResourceKeys.all, 'list'] as const,
  list: (params: EduSafeResourceListKeyParams) => [...edusafeResourceKeys.lists(), params] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EduSafeResourceFetchFilters {
  category?: ResourceCategory | 'all';
  ownerType?: 'all' | 'saas' | 'organisational';
}

interface EduSafeResourceListKeyParams {
  clientId: string | null;
  isClientContext: boolean;
  clientTypeId?: string | null;
  searchQuery?: string;
  page?: number;
  limit?: number;
  category?: ResourceCategory | 'all';
  ownerType?: 'all' | 'saas' | 'organisational';
}

export interface EduSafeResourceListParams extends EduSafeResourceListKeyParams {
  clientName?: string | null;
  enabled: boolean;
}

interface EduSafeResourceListResult {
  resources: EduSafeResource[];
  totalCount: number;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchClientContextResources(params: EduSafeResourceListParams): Promise<EduSafeResourceListResult> {
  const { data: resourcesData, error } = await supabase.functions.invoke('edusafe-resource-client', {
    body: {
      action: 'fetch_resources',
      data: {
        client_id: params.clientId,
        search: params.searchQuery || undefined,
        page: params.page,
        limit: params.limit,
        category: params.category && params.category !== 'all' ? params.category : undefined,
        owner_type: params.ownerType && params.ownerType !== 'all' ? params.ownerType : 'all',
      },
    },
  });

  if (error) {
    console.error('Error fetching resources via edge function:', error);
    throw error;
  }

  const transformedResources: EduSafeResource[] = (resourcesData?.resources || []).map((resource: Record<string, unknown>) => ({
    id: resource.id,
    title: resource.title,
    description: (resource.description as string) || '',
    category: resource.category,
    tags: Array.isArray(resource.tags) ? resource.tags : [],
    uploadDate: resource.uploadDate,
    uploaderId: resource.uploaderId,
    uploaderName: (resource.uploaderName as string) || params.clientName || 'Unknown',
    ownerType: resource.ownerType,
    clientId: resource.clientId,
    resourceType: resource.resourceType,
    document_url: resource.document_url,
    youtube_link: resource.youtube_link as string | undefined,
    file: {
      id: `file-${resource.id as string}`,
      name: extractFileNameFromUrl(resource.document_url as string | undefined, resource.title as string),
      type: 'application/pdf',
      size: (resource.file as Record<string, unknown>)?.size as number || (resource.file_size as number) || 0,
      base64: resource.document_url as string,
    },
  }));

  return {
    resources: transformedResources,
    totalCount: resourcesData?.totalCount ?? transformedResources.length,
  };
}

async function fetchBackofficeResources(params: EduSafeResourceListParams): Promise<EduSafeResourceListResult> {
  let regularQuery = supabase
    .from('edusafe_resources')
    .select('*')
    .eq('client_id', params.clientId)
    .order('created_at', { ascending: false });

  if (params.searchQuery && params.searchQuery.trim() !== '') {
    const s = `%${params.searchQuery.trim()}%`;
    regularQuery = regularQuery.or(`title.ilike.${s},description.ilike.${s},category.ilike.${s}`);
  }

  const { data: regularResources, error: regularError } = await regularQuery;

  if (regularError) throw regularError;

  let backofficeResources: Array<{ id: string; title: string; description?: string; category: string; tags?: unknown; created_at: string; uploaded_by?: string; document_url: string; youtube_link?: string }> = [];
  if (params.clientTypeId) {
    const { data: backofficeData, error: backofficeError } = await supabase.functions.invoke('backoffice-edusafe-resource', {
      body: {
        action: 'list',
        client_type_id: params.clientTypeId,
        search: params.searchQuery || undefined,
        page: params.page,
        limit: params.limit,
      },
    });

    if (backofficeError) {
      console.error('Error fetching backoffice resources:', backofficeError);
    } else {
      backofficeResources = backofficeData.resources || [];
    }
  }

  const transformedResources: EduSafeResource[] = [];

  (regularResources || []).forEach(record => {
    const extRecord = record as typeof record & { youtube_link?: string; file_size?: number };
    const youtubeLink = extRecord.youtube_link;
    transformedResources.push({
      id: record.id,
      title: record.title,
      description: record.description || '',
      category: record.category as ResourceCategory,
      tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
      uploadDate: record.created_at,
      uploaderId: record.uploaded_by || 'unknown',
      uploaderName: params.clientName || 'Unknown',
      ownerType: 'school',
      clientId: record.client_id,
      resourceType: 'Organisational Resource',
      document_url: record.document_url,
      youtube_link: youtubeLink,
      file: {
        id: `file-${record.id}`,
        name: extractFileNameFromUrl(record.document_url, record.title),
        type: 'application/pdf',
        size: extRecord.file_size || 0,
        base64: record.document_url,
      },
    });
  });

  backofficeResources.forEach(record => {
    const youtubeLink = record.youtube_link;
    transformedResources.push({
      id: `backoffice-${record.id}`,
      title: record.title,
      description: record.description || '',
      category: record.category as ResourceCategory,
      tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
      uploadDate: record.created_at,
      uploaderId: record.uploaded_by || 'unknown',
      uploaderName: 'EduSafe Team',
      ownerType: 'saas',
      clientId: params.clientId,
      resourceType: 'Global Resource',
      document_url: record.document_url,
      youtube_link: youtubeLink,
      file: {
        id: `file-backoffice-${record.id}`,
        name: extractFileNameFromUrl(record.document_url, record.title),
        type: 'application/pdf',
        size: 0,
        base64: record.document_url,
      },
    });
  });

  transformedResources.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  return {
    resources: transformedResources,
    totalCount: transformedResources.length,
  };
}

/** Fetch the EduSafe resources list (client-context edge function, or backoffice table + edge function). */
export function useEduSafeResourcesList(params: EduSafeResourceListParams) {
  const { clientName, enabled, ...keyParams } = params;

  return useQuery({
    queryKey: edusafeResourceKeys.list(keyParams),
    queryFn: () => (params.isClientContext ? fetchClientContextResources(params) : fetchBackofficeResources(params)),
    enabled: enabled && !!params.clientId,
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000, // resource library changes infrequently — avoid refetching on quick back-and-forth navigation
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddEduSafeResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { client_id: string | null; resource: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('edusafe-resource-client', {
        body: { action: 'add_resource', data: body },
      });
      if (error) throw error;
      return data;
    },
    // Returned so mutateAsync() doesn't resolve until the list has actually
    // refetched — callers (e.g. ResourceCard's delete-confirm dialog) await
    // this and expect `resources` to already reflect the change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: edusafeResourceKeys.all }),
  });
}

export function useUpdateEduSafeResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { formData: FormData } | { body: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('edusafe-resource-upload', {
        method: 'PUT',
        body: 'formData' in input ? input.formData : input.body,
      });
      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Failed to update resource');
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: edusafeResourceKeys.all }),
  });
}

export function useDeleteEduSafeResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { id: string; client_id?: string | null }) => {
      const { data, error } = await supabase.functions.invoke('edusafe-resource-client', {
        body: { action: 'delete_resource', data: body },
      });
      if (error) throw error;
      if (!data?.success) throw new Error('Failed to delete resource');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: edusafeResourceKeys.all }),
  });
}
