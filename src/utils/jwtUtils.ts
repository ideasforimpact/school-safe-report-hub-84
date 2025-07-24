// Browser-compatible token utilities for backoffice authentication
// Using simple token generation with timestamps and basic encoding

export interface BackofficeTokenPayload {
  userId: string;
  email: string;
  role: 'saas_owner';
  isBackofficeUser: boolean;
  issuedAt: number;
  expiresAt: number;
}

// Generate a simple token with 24-hour expiration
export const generateBackofficeToken = (userId: string, email: string): string => {
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now
  
  const payload: BackofficeTokenPayload = {
    userId,
    email,
    role: 'saas_owner',
    isBackofficeUser: true,
    issuedAt: now,
    expiresAt
  };

  // Simple base64 encoding for browser compatibility
  const tokenData = btoa(JSON.stringify(payload));
  
  // Add a simple signature using timestamp and user data
  const signature = btoa(`${userId}-${email}-${now}`);
  
  return `${tokenData}.${signature}`;
};

export const verifyBackofficeToken = (token: string): BackofficeTokenPayload | null => {
  try {
    const [tokenData, signature] = token.split('.');
    
    if (!tokenData || !signature) {
      return null;
    }

    const payload = JSON.parse(atob(tokenData)) as BackofficeTokenPayload;
    
    // Verify the token hasn't expired
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    // Basic signature verification
    const expectedSignature = btoa(`${payload.userId}-${payload.email}-${payload.issuedAt}`);
    if (signature !== expectedSignature) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const [tokenData] = token.split('.');
    if (!tokenData) return true;
    
    const payload = JSON.parse(atob(tokenData)) as BackofficeTokenPayload;
    return Date.now() > payload.expiresAt;
  } catch (error) {
    return true;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const [tokenData] = token.split('.');
    if (!tokenData) return null;
    
    const payload = JSON.parse(atob(tokenData)) as BackofficeTokenPayload;
    return payload.expiresAt;
  } catch (error) {
    return null;
  }
};