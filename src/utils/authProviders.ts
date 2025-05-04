
/**
 * This file contains utilities for working with OAuth authentication providers.
 * In a real implementation, these would connect to the actual OAuth services.
 */

// Define a string union type for provider names
export type OAuthProviderName = 'google' | 'microsoft' | 'zoho';

// Interface for OAuth provider configuration
export interface OAuthProviderConfig {
  name: string;
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  responseType: string;
  isConfigured?: boolean; // Optional property to check if provider is configured
}

// Type for the record of all available providers
export type OAuthProviderConfigs = Record<OAuthProviderName, OAuthProviderConfig>;

// Mock configurations for each provider
export const providerConfigs: OAuthProviderConfigs = {
  google: {
    name: "Google",
    clientId: "google-client-id", // Would be replaced with actual client ID
    redirectUri: `${window.location.origin}/auth/callback`,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "email profile",
    responseType: "code"
  },
  microsoft: {
    name: "Microsoft",
    clientId: "microsoft-client-id", // Would be replaced with actual client ID
    redirectUri: `${window.location.origin}/auth/callback`,
    authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "user.read",
    responseType: "code"
  },
  zoho: {
    name: "Zoho",
    clientId: "zoho-client-id", // Would be replaced with actual client ID
    redirectUri: `${window.location.origin}/auth/callback`,
    authorizationEndpoint: "https://accounts.zoho.com/oauth/v2/auth",
    tokenEndpoint: "https://accounts.zoho.com/oauth/v2/token",
    scope: "ZohoMail.userinfo.all",
    responseType: "code"
  }
};

/**
 * Updates a provider configuration
 * In a real implementation, this would save to a database or config store
 */
export const updateProviderConfig = (
  provider: OAuthProviderName, 
  updates: Partial<OAuthProviderConfig>
): void => {
  if (providerConfigs[provider]) {
    Object.assign(providerConfigs[provider], updates);
    console.log(`Updated ${provider} configuration:`, providerConfigs[provider]);
    // In a real implementation, you would persist this change to a database
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
};

/**
 * Redirects the user to the OAuth provider's authorization page
 */
export const redirectToOAuthProvider = (provider: OAuthProviderName): void => {
  const config = providerConfigs[provider];
  
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType,
    scope: config.scope
  });
  
  // Add state parameter for security (should be randomly generated and verified after callback)
  const state = Math.random().toString(36).substring(2);
  localStorage.setItem('oauth_state', state);
  params.append('state', state);
  
  // Redirect to authorization endpoint
  window.location.href = `${config.authorizationEndpoint}?${params.toString()}`;
};

/**
 * Extract domain from an email address
 */
export const extractDomain = (email: string): string | null => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};

/**
 * Validates if an email domain is allowed for a client
 */
export const isEmailDomainAllowed = (email: string, allowedDomains: string[]): boolean => {
  if (!allowedDomains || allowedDomains.length === 0) return false;
  
  const domain = extractDomain(email);
  if (!domain) return false;
  
  return allowedDomains.some(allowedDomain => 
    allowedDomain.toLowerCase() === domain
  );
};

/**
 * Validate OAuth provider configuration
 * Returns true if the provider is properly configured
 */
export const isProviderConfigured = (provider: OAuthProviderName): boolean => {
  const config = providerConfigs[provider];
  if (!config) return false;
  
  // Check if clientId is actually set to a real value
  return config.clientId && !config.clientId.includes('-client-id');
};

/**
 * Get all configured providers for a client
 * Returns only the providers that are both enabled for the client and properly configured
 */
export const getConfiguredProvidersForClient = (
  clientProviders: Partial<Record<OAuthProviderName, boolean>>
): OAuthProviderName[] => {
  if (!clientProviders) return [];
  
  return Object.entries(clientProviders)
    .filter(([provider, enabled]) => {
      // Ensure that we only consider valid provider names
      if (!isValidProviderName(provider)) return false;
      return enabled && isProviderConfigured(provider as OAuthProviderName);
    })
    .map(([provider]) => provider as OAuthProviderName);
};

/**
 * Type guard to check if a string is a valid OAuth provider name
 */
export const isValidProviderName = (name: string): name is OAuthProviderName => {
  return ['google', 'microsoft', 'zoho'].includes(name);
};
