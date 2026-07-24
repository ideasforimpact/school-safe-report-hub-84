import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Query key factory ────────────────────────────────────────────────────────
export const sopKeys = {
  all: ['sops'] as const,
  lists: () => [...sopKeys.all, 'list'] as const,
  list: (params: SopListParams) => [...sopKeys.lists(), params] as const,
  assignedLists: () => [...sopKeys.all, 'assigned-list'] as const,
  assignedList: (params: AssignedSopListParams) => [...sopKeys.assignedLists(), params] as const,
  categories: (clientId: string | null) => ['sop-categories', clientId] as const,
  activeGroups: (clientId: string | null) => ['sop-active-groups', clientId] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SopListParams {
  clientId: string | null;
  employeeId: string | null;
  isSuperAdmin: boolean;
  search?: string;
  status?: string;
  categoryId?: string;
  page: number;
  limit: number;
}

export interface AssignedSopListParams {
  clientId: string | null;
  employeeId: string | null;
  search?: string;
  status?: string;
  categoryId?: string;
  page: number;
  limit: number;
}

export interface GroupOption {
  id: string;
  name: string;
  group_type: string | null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch paginated SOP list with optional search / status / category filters. */
export function useSopList(params: SopListParams) {
  return useQuery({
    queryKey: sopKeys.list(params),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-sop', {
        body: {
          client_id: params.clientId,
          employee_id: params.employeeId,
          is_super_admin: params.isSuperAdmin,
          search: params.search?.trim() || null,
          status: params.status && params.status !== 'all' ? params.status : null,
          category_id: params.categoryId && params.categoryId !== 'all' ? params.categoryId : null,
          page: params.page,
          limit: params.limit,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { data: unknown[]; pagination: { total: number } };
    },
    enabled: !!params.clientId,
    placeholderData: (prev) => prev,
    staleTime: 0, // list is paged/filtered/searched — always refetch so the spinner shows on every change
  });
}

/** Fetch assigned SOPs for the current employee with optional filters. */
export function useAssignedSopList(params: AssignedSopListParams) {
  return useQuery({
    queryKey: sopKeys.assignedList(params),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-assigned-sop', {
        body: {
          client_id: params.clientId,
          employee_id: params.employeeId,
          search: params.search?.trim() || null,
          status: params.status && params.status !== 'all' ? params.status : null,
          category_id: params.categoryId && params.categoryId !== 'all' ? params.categoryId : null,
          page: params.page,
          limit: params.limit,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; data: unknown[]; pagination: { total: number } };
    },
    enabled: !!params.clientId && !!params.employeeId,
    placeholderData: (prev) => prev,
    staleTime: 0, // list is paged/filtered/searched — always refetch so the spinner shows on every change
  });
}

/** Fetch SOP categories. Falls back to a direct table query when the edge function fails. */
export function useSopCategories(clientId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: sopKeys.categories(clientId),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-sop-categories', {
        body: { client_id: clientId },
      });
      if (error) {
        console.warn('[useSopCategories] edge function failed, falling back:', error);
        const { data: fbData, error: fbError } = await (supabase as unknown as SupabaseClient)
          .from('sop_categories')
          .select('id, category_name')
          .order('category_name', { ascending: true });
        if (fbError) throw fbError;
        return (fbData || []) as Array<{ id: string; category_name: string }>;
      }
      return (data?.data || []) as Array<{ id: string; category_name: string }>;
    },
    enabled: enabled && !!clientId,
    staleTime: 10 * 60 * 1000, // reference data — only changes when admin creates/renames a category
  });
}

/** Fetch active groups for SOP assignment. */
export function useActiveGroups(clientId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: sopKeys.activeGroups(clientId),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-active-groups', {
        body: { client_id: clientId },
      });
      if (error) throw error;
      return (data?.data || []) as GroupOption[];
    },
    enabled: enabled && !!clientId,
    staleTime: 10 * 60 * 1000, // reference data — only changes when admin adds/removes a group
  });
}

/** Delete a SOP. Invalidates all SOP list queries on success. */
export function useDeleteSop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sopId, clientId }: { sopId: string; clientId: string }) => {
      const { data, error } = await supabase.functions.invoke('delete-sop', {
        body: { sop_id: sopId, client_id: clientId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.details || data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('SOP deleted successfully');
      queryClient.invalidateQueries({ queryKey: sopKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete SOP');
    },
  });
}

/** Create or update a SOP. Include `sop_id` in the body to trigger an update. */
export function useCreateOrUpdateSop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown> & { sop_id?: string }) => {
      const fnName = body.sop_id ? 'update-sop' : 'create-sop';
      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.sop_id ? 'SOP updated successfully' : 'SOP created successfully');
      queryClient.invalidateQueries({ queryKey: sopKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save SOP');
    },
  });
}

/** Assign a SOP to one or more groups. Invalidates all SOP list queries on success. */
export function useAssignSop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      sop_id: string;
      client_id: string;
      employee_id: string;
      group_ids: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('assign-sop', { body });
      if (error) throw error;
      if (data?.error) {
        const detail = data.details ? `: ${data.details}` : '';
        throw new Error(`${data.error}${detail}`);
      }
      return data;
    },
    onSuccess: () => {
      toast.success('SOP assigned successfully');
      queryClient.invalidateQueries({ queryKey: sopKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign SOP');
    },
  });
}
