import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, this should be from environment variables
const JWT_SECRET = 'backoffice-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

export interface BackofficeJWTPayload {
  userId: string;
  email: string;
  role: 'saas_owner';
  isBackofficeUser: boolean;
  iat?: number;
  exp?: number;
}

export const generateBackofficeJWT = (userId: string, email: string): string => {
  const payload: BackofficeJWTPayload = {
    userId,
    email,
    role: 'saas_owner',
    isBackofficeUser: true
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyBackofficeJWT = (token: string): BackofficeJWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as BackofficeJWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const isJWTExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as BackofficeJWTPayload;
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getJWTExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwt.decode(token) as BackofficeJWTPayload;
    return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};