import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { setCurrentUser } from '@/store/authActions';
import { setClientId, setConfiguredModules, setEmployeeData } from '@/store/employeeActions';
import { buildClientLogoUrl } from '@/lib/utils';
import type { User, EmployeeData } from '@/contexts/auth/types';

type SwitchableClient = {
  id: string;
  name: string;
  active: boolean;
  is_head_office: boolean;
};

type SwitchClientResponse = {
  success: boolean;
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
  const { dispatch } = useEmployeeStore();
  const [switchableClients, setSwitchableClients] = useState<SwitchableClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const currentClientId = employeeData?.clientId || currentUser?.clientId || '';

  const shouldShow = useMemo(() => {
    if (isBackofficeUser) return false;
    return switchableClients.length > 1;
  }, [isBackofficeUser, switchableClients.length]);

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

      const modules = (clientModules || [])
        .filter((row: any) => {
          if (isSuperAdmin) return true;
          if (allowedModuleIds.size === 0) return true;
          return allowedModuleIds.has(row.module_id);
        })
        .map((row: any) => ({
          id: row.modules?.id || row.module_id,
          name: row.modules?.name || 'Module',
          key: row.modules?.level || row.module_id,
          icon: row.modules?.icon || '',
          level: row.modules?.level || 'client',
          enabled: true,
          accessLevel: row.access_level || {},
          order: row.modules?.order || 999,
          url: row.modules?.url || '/dashboard',
        }))
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      dispatch(setConfiguredModules(modules));
    } catch (error) {
      console.error('Error refreshing configured modules after client switch:', error);
      toast.error('Client switched, but module refresh failed');
    }
  };

  const loadSwitchableClients = async () => {
    if (!currentUser || !employeeData?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke<SwitchClientResponse>('switch-client', {
        body: { action: 'list-switchable-clients' },
      });

      if (error || !data?.success) {
        setSwitchableClients([]);
        return;
      }

      const clients = Array.isArray(data.clients) ? data.clients : [];
      setSwitchableClients(clients);
      setSelectedClientId(currentClientId || clients[0]?.id || '');
    } catch (error) {
      console.error('Error loading switchable clients:', error);
      setSwitchableClients([]);
    }
  };

  useEffect(() => {
    loadSwitchableClients();
  }, [currentUser?.id, employeeData?.id, currentClientId]);

  const handleSwitchClient = async (targetClientId: string) => {
    if (!currentUser || !employeeData?.id || !targetClientId || targetClientId === currentClientId) {
      setSelectedClientId(targetClientId);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke<SwitchClientResponse>('switch-client', {
        body: {
          action: 'switch-client',
          target_client_id: targetClientId,
        },
      });

      if (error || !data?.success || !data.selected_client) {
        throw new Error(data?.error || error?.message || 'Failed to switch client');
      }

      const selectedClient = data.selected_client;
      const logo = buildClientLogoUrl(selectedClient.logo || selectedClient.client_logo) || undefined;
      const updatedUser: User = {
        ...currentUser,
        clientId: selectedClient.id,
        client: {
          ...(currentUser.client || {}),
          id: selectedClient.id,
          name: selectedClient.name,
          active: selectedClient.active,
          is_head_office: selectedClient.is_head_office,
          client_type_id: selectedClient.client_type_id || undefined,
          institution_type: selectedClient.institution_type || undefined,
          logo,
        },
      };

      const updatedEmployeeData: EmployeeData = {
        ...(employeeData || {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          clientId: selectedClient.id,
        }),
        clientId: selectedClient.id,
        client: {
          ...(employeeData?.client || {}),
          id: selectedClient.id,
          name: selectedClient.name,
          active: selectedClient.active,
          is_head_office: selectedClient.is_head_office,
          client_type_id: selectedClient.client_type_id || undefined,
          institution_type: selectedClient.institution_type || undefined,
          logo,
        },
      };

      dispatch(setCurrentUser(updatedUser));
      dispatch(setEmployeeData(updatedEmployeeData));
      dispatch(setClientId(selectedClient.id));
      await loadConfiguredModules(employeeData.id, selectedClient.id, employeeData.isSuperAdmin === true);
      setSelectedClientId(selectedClient.id);
      toast.success(`Switched to ${selectedClient.name}`);
    } catch (error) {
      console.error('Error switching client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to switch client');
      setSelectedClientId(currentClientId || '');
    } finally {
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
