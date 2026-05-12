import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setClientId, setConfiguredModules, setLoading, setSwitchContext } from '@/store/employeeActions';
import type { User, EmployeeData } from '@/contexts/auth/types';

type SwitchableClient = {
  id: string;
  name: string;
  active: boolean;
  is_head_office: boolean;
};

type SwitchClientResponse = {
  success: boolean;
  home_client_id?: string | null;
  target_client_id?: string | null;
  is_switched_context?: boolean;
  client_management_read_only?: boolean;
  client_management_permissions?: {
    access_level?: 'R' | 'W/R';
  };
  clients?: SwitchableClient[];
  selected_client?: {
    id: string;
    name: string;
    active: boolean;
    is_head_office: boolean;
    client_type_id?: string | null;
    institution_type?: string | null;
    logo?: string | null;
    client_logo?: string | null;
  };
  error?: string;
};

type ConfiguredModuleRow = {
  module_id: string;
  enabled?: boolean;
  access_level?: unknown;
  modules?: {
    id?: string;
    name?: string;
    icon?: string;
    level?: string;
    order?: number;
    url?: string;
  } | null;
};

type NavigationModule = {
  url?: string;
};

const cachedSwitchableClientsByUserId: Record<string, SwitchableClient[]> = {};
const switchClientInflight = new Map<string, Promise<{ data: SwitchClientResponse | null; error: unknown }>>();
const switchClientRecent = new Map<string, { at: number; value: { data: SwitchClientResponse | null; error: unknown } }>();
const SWITCH_CLIENT_DEDUPE_MS = 1200;

const invokeSwitchClient = async (body: Record<string, unknown>) => {
  const key = JSON.stringify(body);
  const now = Date.now();
  const recent = switchClientRecent.get(key);
  if (recent && now - recent.at < SWITCH_CLIENT_DEDUPE_MS) {
    return recent.value;
  }

  const existing = switchClientInflight.get(key);
  if (existing) {
    return existing;
  }

  const request = supabase.functions
    .invoke<SwitchClientResponse>('switch-client', { body })
    .then((value) => {
      switchClientRecent.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      switchClientInflight.delete(key);
    });

  switchClientInflight.set(key, request);
  return request;
};

interface HeaderClientSwitcherProps {
  currentUser: User | null;
  employeeData: EmployeeData | null;
  isBackofficeUser: boolean;
}

const HeaderClientSwitcher: React.FC<HeaderClientSwitcherProps> = ({
  currentUser,
  employeeData,
  isBackofficeUser,
}) => {
  const { state, dispatch } = useEmployeeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const cachedClientsForCurrentUser = currentUser?.id
    ? (cachedSwitchableClientsByUserId[currentUser.id] || [])
    : [];
  const [switchableClients, setSwitchableClients] = useState<SwitchableClient[]>(cachedClientsForCurrentUser);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const currentClientId =
    state.activeClientId ||
    employeeData?.homeClientId ||
    employeeData?.clientId ||
    currentUser?.clientId ||
    '';

  const shouldShow = useMemo(() => {
    if (isBackofficeUser) return false;
    if (employeeData?.isSuperAdmin !== true) return false;
    const effectiveCount =
      switchableClients.length > 0
        ? switchableClients.length
        : cachedClientsForCurrentUser.length;
    return effectiveCount > 1;
  }, [isBackofficeUser, employeeData?.isSuperAdmin, switchableClients.length, cachedClientsForCurrentUser.length]);

  const loadConfiguredModules = async (employeeId: string, targetClientId: string, isSuperAdmin: boolean) => {
    try {
      const { data: clientModules, error: clientModulesError } = await supabase
        .from('client_modules')
        .select(`
          module_id,
          enabled,
          access_level,
          modules(id, name, icon, level, order, url)
        `)
        .eq('client_id', targetClientId)
        .eq('enabled', true);

      if (clientModulesError) {
        throw clientModulesError;
      }

      let allowedModuleIds = new Set<string>();
      if (!isSuperAdmin) {
        const { data: employeeModules, error: employeeModulesError } = await supabase
          .from('employee_modules')
          .select('module_id')
          .eq('employee_id', employeeId);

        if (employeeModulesError) {
          throw employeeModulesError;
        }

        allowedModuleIds = new Set((employeeModules || []).map((row) => row.module_id));
      }

      const modules = ((clientModules || []) as ConfiguredModuleRow[])
        .filter((row) => {
          if (isSuperAdmin) return true;
          if (allowedModuleIds.size === 0) return true;
          return allowedModuleIds.has(row.module_id);
        })
        .map((row) => ({
          id: row.modules?.id || row.module_id,
          name: row.modules?.name || 'Module',
          key: row.modules?.level || row.module_id,
          icon: row.modules?.icon || '',
          level: row.modules?.level || 'client',
          enabled: true,
          accessLevel: row.access_level || {},
          order: row.modules?.order || 999,
          url: row.modules?.url || `/${(row.modules?.name || 'dashboard').toLowerCase().replace(/\s+/g, '-')}`,
        }))
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      dispatch(setConfiguredModules(modules));
      return modules;
    } catch (error) {
      console.error('Error refreshing configured modules after client switch:', error);
      toast.error('Client switched, but module refresh failed');
      return [];
    }
  };

  const loadSwitchableClients = async () => {
    if (!currentUser || !employeeData?.id) return;

    // Do not call the edge function unless client switching can apply (same rules as shouldShow).
    if (isBackofficeUser || employeeData.isSuperAdmin !== true) {
      setSwitchableClients([]);
      return;
    }

    const cachedClients = cachedSwitchableClientsByUserId[currentUser.id];
    if (cachedClients && cachedClients.length > 0) {
      setSwitchableClients(cachedClients);
      const activeId =
        state.activeClientId ||
        employeeData?.homeClientId ||
        employeeData?.clientId ||
        currentUser?.clientId ||
        cachedClients[0]?.id ||
        '';
      setSelectedClientId(activeId);
      return;
    }

    try {
      const { data, error } = await invokeSwitchClient({ action: 'list-switchable-clients' });

      if (error || !data?.success) {
        setSwitchableClients([]);
        return;
      }

      const clients = Array.isArray(data.clients) ? data.clients : [];
      setSwitchableClients(clients);
      cachedSwitchableClientsByUserId[currentUser.id] = clients;

      const homeId =
        data.home_client_id ||
        employeeData?.homeClientId ||
        employeeData?.clientId ||
        '';
      let effectiveData = data;
      let activeId = data.target_client_id || currentClientId || homeId || clients[0]?.id || '';

      // Fresh login should always land on Head Office (home client), not previous switched client.
      if (!state.isSwitchedContext && homeId && activeId !== homeId) {
        const { data: resetData, error: resetError } = await invokeSwitchClient({
          action: 'switch-client',
          target_client_id: homeId,
        });

        if (!resetError && resetData?.success) {
          effectiveData = resetData;
          activeId = resetData.target_client_id || homeId;
        } else {
          // Keep UI aligned to home client even if reset call fails.
          activeId = homeId;
        }
      }

      setSelectedClientId(activeId);
      dispatch(setSwitchContext({
        homeClientId: effectiveData.home_client_id || homeId || null,
        activeClientId: activeId || null,
        isSwitchedContext: effectiveData.is_switched_context === true,
        clientManagementReadOnly: effectiveData.client_management_read_only === true,
        switchedAccessLevel: effectiveData.client_management_permissions?.access_level || 'R',
      }));

      if (activeId && activeId !== currentClientId && employeeData?.id) {
        dispatch(setClientId(activeId));
        await loadConfiguredModules(employeeData.id, activeId, employeeData.isSuperAdmin === true);
      }
    } catch (error) {
      console.error('Error loading switchable clients:', error);
      setSwitchableClients([]);
    }
  };

  useEffect(() => {
    loadSwitchableClients();
  }, [currentUser?.id, employeeData?.id, employeeData?.isSuperAdmin, isBackofficeUser]);

  const handleSwitchClient = async (targetClientId: string) => {
    if (!currentUser || !employeeData?.id || !targetClientId || targetClientId === currentClientId) {
      setSelectedClientId(targetClientId);
      return;
    }

    try {
      setIsLoading(true);
      dispatch(setLoading(true));
      const { data, error } = await invokeSwitchClient({
        action: 'switch-client',
        target_client_id: targetClientId,
      });

      if (error || !data?.success || !data.selected_client) {
        throw new Error(data?.error || error?.message || 'Failed to switch client');
      }

      const selectedClient = data.selected_client;
      dispatch(setClientId(selectedClient.id));
      dispatch(setSwitchContext({
        homeClientId:
          data.home_client_id ||
          employeeData?.homeClientId ||
          employeeData?.clientId ||
          null,
        activeClientId: data.target_client_id || selectedClient.id,
        isSwitchedContext: data.is_switched_context === true,
        clientManagementReadOnly: data.client_management_read_only === true,
        switchedAccessLevel: data.client_management_permissions?.access_level || 'R',
      }));
      const modules = await loadConfiguredModules(employeeData.id, selectedClient.id, employeeData.isSuperAdmin === true);
      setSelectedClientId(selectedClient.id);

      const allowedPaths = modules
        .map((module: NavigationModule) => module.url)
        .filter((url: string | undefined): url is string => typeof url === 'string' && url.length > 0);
      const firstAllowedPath = allowedPaths[0] || '/dashboard';
      const normalizePath = (path: string) => {
        if (!path) return '/';
        return path.length > 1 ? path.replace(/\/+$/, '') : path;
      };
      const currentPath = normalizePath(location.pathname);
      const isCurrentPathAllowed = allowedPaths.some((path) => {
        const allowedBase = normalizePath(path);
        return currentPath === allowedBase || currentPath.startsWith(`${allowedBase}/`);
      });
      if (!isCurrentPathAllowed && location.pathname !== firstAllowedPath) {
        navigate(firstAllowedPath, { replace: true });
      }

      toast.success(`Switched to ${selectedClient.name}`);
    } catch (error) {
      console.error('Error switching client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to switch client');
      setSelectedClientId(currentClientId || '');
    } finally {
      dispatch(setLoading(false));
      setIsLoading(false);
    }
  };

  if (!shouldShow) return null;
  
  return (
    <div className="min-w-[220px]">
      <Select value={selectedClientId} onValueChange={handleSwitchClient} disabled={isLoading}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Switch client" />
        </SelectTrigger>
        <SelectContent>
          {switchableClients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.is_head_office ? `${client.name} (Head Office)` : client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default HeaderClientSwitcher;
