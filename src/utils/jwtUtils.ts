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
  console.log('🔑 verifyBackofficeToken: Starting verification', { tokenLength: token?.length });
  try {
    const [tokenData, signature] = token.split('.');
    
    if (!tokenData || !signature) {
      console.log('🔑 verifyBackofficeToken: Invalid token format - missing data or signature');
      return null;
    }

    const payload = JSON.parse(atob(tokenData)) as BackofficeTokenPayload;
    console.log('🔑 verifyBackofficeToken: Token payload decoded', { 
      userId: payload.userId, 
      email: payload.email, 
      expiresAt: new Date(payload.expiresAt).toISOString(),
      issuedAt: new Date(payload.issuedAt).toISOString()
    });
    
    // Verify the token hasn't expired
    const now = Date.now();
    if (now > payload.expiresAt) {
      console.log('🔑 verifyBackofficeToken: Token has expired', { 
        now: new Date(now).toISOString(), 
        expiresAt: new Date(payload.expiresAt).toISOString() 
      });
      return null;
    }

    // Basic signature verification
    const expectedSignature = btoa(`${payload.userId}-${payload.email}-${payload.issuedAt}`);
    if (signature !== expectedSignature) {
      console.log('🔑 verifyBackofficeToken: Signature verification failed');
      return null;
    }

    console.log('🔑 verifyBackofficeToken: Token verification successful');
    return payload;
  } catch (error) {
    console.error('🔑 verifyBackofficeToken: Token verification failed:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  console.log('🔑 isTokenExpired: Checking token expiration');
  try {
    const [tokenData] = token.split('.');
    if (!tokenData) {
      console.log('🔑 isTokenExpired: No token data found');
      return true;
    }
    
    const payload = JSON.parse(atob(tokenData)) as BackofficeTokenPayload;
    const isExpired = Date.now() > payload.expiresAt;
    console.log('🔑 isTokenExpired: Token expiration check', { 
      isExpired, 
      expiresAt: new Date(payload.expiresAt).toISOString(),
      now: new Date().toISOString()
    });
    return isExpired;
  } catch (error) {
    console.log('🔑 isTokenExpired: Error checking expiration:', error);
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