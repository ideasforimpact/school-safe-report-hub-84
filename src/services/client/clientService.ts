import { supabase } from '@/integrations/supabase/client';

export interface ClientModule {
  id: string;
  client_id: string;
  module_id: string;
  enabled: boolean;
  access_level: Record<string, any>;
  modules: {
    id: string;
    name: string;
    icon: string;
    level: string;
    url?: string;
    order?: number;
  };
}

export interface AvailableModule {
  id: string;
  name: string;
  icon: string;
  level: string;
  url?: string;
  order?: number;
}

export interface ClientData {
  id: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  logo?: string;
  institution_type?: string;
  allowed_domains?: string;
  auth_providers?: string;
  super_admin_allowed_domain?: string;
  active: boolean;
  creation_date: string;
}

export interface ClientDetailsResponse {
  client: ClientData;
  modules: ClientModule[];
  availableModules: AvailableModule[];
}

export const fetchClientDetails = async (clientId: string): Promise<ClientDetailsResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('client-management', {
      method: 'GET',
      body: null,
    });

    if (error) {
      throw new Error(`Failed to fetch client details: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};
