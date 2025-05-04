
/**
 * This file contains utilities for working with OAuth authentication providers.
 * In a real implementation, these would connect to the actual OAuth services.
 */

// Interface for OAuth provider configuration
export interface OAuthProviderConfig {
  name: string;
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  responseType: string;
}

// Mock configurations for each provider
export const providerConfigs: Record<string, OAuthProviderConfig> = {
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
 * Redirects the user to the OAuth provider's authorization page
 */
export const redirectToOAuthProvider = (provider: string): void => {
  const config = providerConfigs[provider.toLowerCase()];
  
  if (!config) {
    console.error(`Unknown provider: ${provider}`);
    return;
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
