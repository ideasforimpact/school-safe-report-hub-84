
import { Database } from '@/integrations/supabase/types';
import { OAuthProviderName } from '@/utils/authProviders';
import { ModulePermissions } from '@/contexts/auth/types';

// Use the Supabase generated types as a reference
export type ClientRecord = Database['public']['Tables']['clients']['Row'];
export type ModuleRecord = Database['public']['Tables']['modules']['Row'];
export type ClientModuleRecord = Database['public']['Tables']['client_modules']['Row'];

// Helper functions to convert between Supabase and application types
import { buildClientLogoUrl } from '@/lib/utils';

export const mapDbClientToClient = (dbClient: ClientRecord) => {
  // Build logo URL from path if it's a path, otherwise use as-is (for backward compatibility)
  const logoUrl = buildClientLogoUrl(dbClient.logo || dbClient.client_logo);
  
  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email || '',
    contactPerson: dbClient.contact_person || '',
    phone: dbClient.phone || '',
    creationDate: dbClient.creation_date.toString(),
    active: dbClient.active,
    logo: logoUrl,
    institutionType: dbClient.institution_type || undefined,
    clientTypeId: dbClient.client_type_id || undefined,
    allowedDomains: dbClient.allowed_domains ? dbClient.allowed_domains.split(',') : [],
    superAdminAllowedDomains: dbClient.super_admin_allowed_domain ? dbClient.super_admin_allowed_domain.split(',') : [],
    authProviders: parseAuthProviders(dbClient.auth_providers || '')
  };
};

const parseAuthProviders = (authProviders: string): { [key in OAuthProviderName]?: boolean } => {
  if (!authProviders || authProviders.trim() === '') {
    return {
      google: false,
      microsoft: false,
      zoho: false
    };
  }
  
  // Try to parse as JSON first (production format: {"google":true,"microsoft":false,"zoho":false})
  try {
    const parsed = JSON.parse(authProviders);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        google: parsed.google === true,
        microsoft: parsed.microsoft === true,
        zoho: parsed.zoho === true
      };
    }
  } catch (e) {
    // Not JSON, try comma-separated format (legacy format: "google,microsoft")
  const providers = authProviders.split(',');
  return {
    google: providers.includes('google'),
    microsoft: providers.includes('microsoft'),
    zoho: providers.includes('zoho')
    };
  }
  
  // Default fallback
  return {
    google: false,
    microsoft: false,
    zoho: false
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
    client_logo: client.client_logo || null,
    institution_type: client.institutionType || null,
    client_type_id: client.clientTypeId || null,
    allowed_domains: client.allowedDomains && client.allowedDomains.length > 0 
      ? client.allowedDomains.join(',') 
      : null,
    super_admin_allowed_domain: client.superAdminAllowedDomains && client.superAdminAllowedDomains.length > 0
      ? client.superAdminAllowedDomains.join(',')
      : null,
    auth_providers: client.authProviders 
      ? Object.entries(client.authProviders)
          .filter(([_, enabled]) => enabled)
          .map(([provider]) => provider)
          .join(',')
      : null
  };
};
