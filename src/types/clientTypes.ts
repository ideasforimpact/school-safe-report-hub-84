
import { Database } from '@/integrations/supabase/types';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';

// Use the Supabase generated types as a reference
export type ClientRecord = Database['public']['Tables']['clients']['Row'];
export type ModuleRecord = Database['public']['Tables']['modules']['Row'];
export type ClientModuleRecord = Database['public']['Tables']['client_modules']['Row'];

// Helper functions to convert between Supabase and application types
export const mapDbClientToClient = (dbClient: ClientRecord) => {
  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email || '',
    contactPerson: dbClient.contact_person || '',
    phone: dbClient.phone || '',
    creationDate: dbClient.creation_date.toString(),
    active: dbClient.active,
    logo: dbClient.logo || undefined,
    institutionType: dbClient.institution_type || undefined,
    allowedDomains: dbClient.allowed_domains ? dbClient.allowed_domains.split(',') : [],
    authProviders: parseAuthProviders(dbClient.auth_providers || '')
  };
};

const parseAuthProviders = (authProviders: string): { [key in OAuthProviderName]?: boolean } => {
  const providers = authProviders.split(',');
  return {
    google: providers.includes('google'),
    microsoft: providers.includes('microsoft'),
    zoho: providers.includes('zoho')
  };
};

export const prepareClientForDb = (client: any): Omit<ClientRecord, 'id' | 'creation_date'> => {
  return {
    name: client.name,
    email: client.email,
    contact_person: client.contactPerson,
    phone: client.phone,
    active: client.active,
    logo: client.logo || null,
    institution_type: client.institutionType || null,
    allowed_domains: client.allowedDomains && client.allowedDomains.length > 0 
      ? client.allowedDomains.join(',') 
      : null,
    auth_providers: client.authProviders 
      ? Object.entries(client.authProviders)
          .filter(([_, enabled]) => enabled)
          .map(([provider]) => provider)
          .join(',')
      : null
  };
};
