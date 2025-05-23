
// Types
export type OAuthProviderName = 'google' | 'microsoft' | 'zoho';

// Initial provider configs (empty for now)
export const providerConfigs: Record<OAuthProviderName, { clientId: string }> = {
  google: { clientId: '' },
  microsoft: { clientId: '' },
  zoho: { clientId: '' }
};

// Function to update provider config
export const updateProviderConfig = (
  provider: OAuthProviderName,
  config: { clientId: string }
) => {
  providerConfigs[provider] = {
    ...providerConfigs[provider],
    ...config
  };
  
  // In a real application, we would save this to a database or local storage
  console.log(`Updated ${provider} configuration:`, providerConfigs[provider]);
};
