
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
    console.log(`Calling client-management edge function with clientId: ${clientId}`);
    
    const { data, error } = await supabase.functions.invoke('client-management', {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      // Pass clientId as a query parameter
      query: { clientId }
    });

    if (error) {
      console.error('Error from client-management function:', error);
      throw new Error(`Failed to fetch client details: ${error.message}`);
    }

    console.log('Response from client-management:', data);
    return data;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};

export const updateClientModule = async (moduleId: string, updateData: { enabled: boolean }) => {
  try {
    const { data, error } = await supabase
      .from('client_modules')
      .update(updateData)
      .eq('id', moduleId)
      .select();

    if (error) {
      throw new Error(`Failed to update client module: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating client module:', error);
    throw error;
  }
};
