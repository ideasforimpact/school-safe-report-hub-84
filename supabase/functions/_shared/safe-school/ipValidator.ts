/**
 * IP Whitelisting Utility for SafeSchool
 * Handles IP extraction, validation, and whitelist checking
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from './logging.ts';

/**
 * Exception routes that should bypass IP whitelist checks
 * These routes are public and should be accessible from anywhere
 */
const EXCEPTION_ROUTES = [
  '/public-grievance-form',
  '/grievance-thank-you',
  '/public-form',
  '/form/', // Form submission routes - accessible from anywhere without IP restrictions
  // Add other public routes that should bypass IP check
];

/**
 * Routes that should never have IP restrictions
 * Backoffice routes and cron jobs are excluded from IP validation
 */
const EXCLUDED_ROUTE_PATTERNS = [
  '/backoffice',
  '/backoffice-',
  '-cron',
  'cron-',
];

/**
 * Edge functions that are called by cron jobs
 * These should never have IP restrictions
 * 
 * Note: Functions with "-cron" suffix are automatically detected,
 * but functions like "process-email-queue" need to be explicitly listed
 */
const CRON_TRIGGERED_FUNCTIONS = [
  // Process functions called by cron jobs
  'process-email-queue',
  'process-assessment-notifications',
  'process-grievance-notifications',
  // Cron functions (those with "-cron" suffix are also caught by pattern matching)
  'assessment-reminder-cron',
  'assessment-reminders-cron',
  'incident-reminder-cron',
  'bank-statement-cron',
];

/**
 * Extract client IP address from request headers
 * Handles various proxy and load balancer scenarios
 * 
 * Priority order:
 * 1. CF-Connecting-IP (Cloudflare - most reliable)
 * 2. X-Real-IP (Nginx proxy)
 * 3. X-Forwarded-For (first IP in chain)
 * 4. Fallback to 'unknown'
 * 
 * @param req - The incoming request
 * @returns The client IP address as a string
 */
export function getClientIP(req: Request): string {
  // Extract all IP-related headers for logging
  const netlifyIp = req.headers.get('x-nf-client-connection-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const realIp = req.headers.get('x-real-ip');
  const forwardedFor = req.headers.get('x-forwarded-for');
  
  // Log all IP headers for debugging
  logger.debug('IP Headers extracted from request', {
    'x-nf-client-connection-ip': netlifyIp || 'not present',
    'cf-connecting-ip': cfConnectingIp || 'not present',
    'x-real-ip': realIp || 'not present',
    'x-forwarded-for': forwardedFor || 'not present',
    allHeaders: Object.fromEntries(req.headers.entries())
  });
  
  // Priority 1: Netlify header
  if (netlifyIp) {
    const ip = netlifyIp.trim();
    logger.debug('Using x-nf-client-connection-ip', { ip });
    return ip;
  }
  
  // Priority 2: Cloudflare header (most reliable, can't be easily spoofed)
  if (cfConnectingIp) {
    const ip = cfConnectingIp.trim();
    logger.debug('Using cf-connecting-ip', { ip });
    return ip;
  }
  
  // Priority 3: Real IP from proxy (Nginx, etc.)
  if (realIp) {
    const ip = realIp.trim();
    logger.debug('Using x-real-ip', { ip });
    return ip;
  }
  
  // Priority 4: Forwarded for header (may contain multiple IPs, take first)
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the original client IP (first one)
    const ip = forwardedFor.split(',')[0].trim();
    const allIPs = forwardedFor.split(',').map(i => i.trim());
    logger.debug('Using x-forwarded-for (first IP)', { 
      ip, 
      allIPs,
      totalIPs: allIPs.length 
    });
    return ip;
  }
  
  // Fallback - should rarely happen
  logger.warn('Could not determine client IP from headers', {
    'x-nf-client-connection-ip': netlifyIp || 'not present',
    'cf-connecting-ip': cfConnectingIp || 'not present',
    'x-real-ip': realIp || 'not present',
    'x-forwarded-for': forwardedFor || 'not present'
  });
  return 'unknown';
}

/**
 * Check if a route should bypass IP whitelist validation
 * 
 * @param pathname - The request pathname
 * @returns true if the route should bypass IP check
 */
export function shouldBypassIPCheck(pathname: string): boolean {
  // Check exception routes (public routes)
  if (EXCEPTION_ROUTES.some(route => pathname.startsWith(route))) {
    return true;
  }
  
  // Check excluded route patterns (backoffice, cron jobs)
  if (EXCLUDED_ROUTE_PATTERNS.some(pattern => pathname.includes(pattern))) {
    return true;
  }
  
  return false;
}

/**
 * Check if a route is a backoffice route
 * Backoffice routes should never have IP restrictions
 * 
 * @param pathname - The request pathname
 * @returns true if the route is a backoffice route
 */
export function isBackofficeRoute(pathname: string): boolean {
  return pathname.startsWith('/backoffice') || 
         pathname.includes('backoffice-') ||
         pathname.includes('-backoffice');
}

/**
 * Check if a route is a cron job
 * Cron jobs should never have IP restrictions
 * 
 * @param pathname - The request pathname
 * @returns true if the route is a cron job
 */
export function isCronJob(pathname: string): boolean {
  // Check for cron patterns in pathname
  if (pathname.includes('-cron') || 
      pathname.includes('cron-') ||
      pathname.includes('/cron/')) {
    return true;
  }
  
  // Check if pathname contains any cron-triggered function names
  // Edge functions are typically accessed via /functions/v1/{function-name}
  for (const cronFunction of CRON_TRIGGERED_FUNCTIONS) {
    if (pathname.includes(`/${cronFunction}`) || pathname.includes(`/${cronFunction}/`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate IPv4 address format
 * 
 * @param ip - IP address to validate
 * @returns true if valid IPv4 format
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  // Check each octet is 0-255
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validate IPv6 address format (basic validation)
 * 
 * @param ip - IP address to validate
 * @returns true if valid IPv6 format
 */
export function isValidIPv6(ip: string): boolean {
  // Basic IPv6 validation (simplified)
  // Full IPv6 validation is complex, this covers most cases
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Check if an IP address is whitelisted for a client
 * 
 * Logic:
 * - If no IPs are whitelisted → Allow access (backward compatibility)
 * - If IPs exist but don't match → Deny access
 * - If database error → Deny access (fail closed for security)
 * 
 * @param supabase - Supabase client instance
 * @param clientId - The client ID to check
 * @param clientIP - The client IP address to validate
 * @returns Promise<boolean> - true if IP is whitelisted or no whitelist exists
 */
export async function isIPWhitelisted(
  supabase: SupabaseClient,
  clientId: string,
  clientIP: string
): Promise<boolean> {
  // If IP is unknown, deny access (fail closed)
  if (clientIP === 'unknown') {
    logger.warn('Unknown client IP, denying access', { clientId });
    return false;
  }
  
  try {
    // Query active whitelisted IPs for this client
    const { data, error } = await supabase
      .from('client_ip_whitelist')
      .select('ip_address')
      .eq('client_id', clientId)
      .eq('is_active',   true);
    
    if (error) {
      logger.error('Error checking IP whitelist', { 
        clientId, 
        clientIP, 
        error: error.message 
      });
      // Fail closed on database error (security first)
      return false;
    }
    
    // If no IPs whitelisted, allow access (backward compatibility)
    if (!data || data.length === 0) {
      logger.debug('No IPs whitelisted for client, allowing access', { clientId });
      return true;
    }
    
    // Check if client IP matches any whitelisted IP
    const isWhitelisted = data.some(record => {
      const whitelistedIP = record.ip_address.trim();
      // Exact match (for now, CIDR support can be added later)
      return whitelistedIP === clientIP;
    });
    
    if (!isWhitelisted) {
      logger.warn('IP not whitelisted, access denied', { 
        clientId, 
        clientIP,
        whitelistedIPs: data.map(r => r.ip_address)
      });
    }
    
    return isWhitelisted;
  } catch (error) {
    logger.error('Exception in IP whitelist check', { 
      clientId, 
      clientIP, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Fail closed on exception
    return false;
  }
}

/**
 * Validate IP whitelist for a request
 * This is the main function to use in edge functions
 * 
 * @param supabase - Supabase client instance
 * @param req - The incoming request
 * @param clientId - The client ID (can be extracted from token or request)
 * @param pathname - The request pathname (for exception route checking)
 * @returns Promise<{ allowed: boolean; reason?: string }>
 */
export async function validateIPWhitelist(
  supabase: SupabaseClient,
  req: Request,
  clientId: string | null,
  pathname: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check if route should bypass IP check
  if (shouldBypassIPCheck(pathname)) {
    logger.debug('Route bypasses IP check', { pathname });
    return { allowed: true, reason: 'exception_route' };
  }
  
  // Check if it's a backoffice route
  if (isBackofficeRoute(pathname)) {
    logger.debug('Backoffice route, skipping IP check', { pathname });
    return { allowed: true, reason: 'backoffice_route' };
  }
  
  // Check if it's a cron job
  if (isCronJob(pathname)) {
    logger.debug('Cron job route, skipping IP check', { pathname });
    return { allowed: true, reason: 'cron_job' };
  }
  
  // If no client ID, we can't check whitelist
  // This might happen for unauthenticated requests to non-exception routes
  if (!clientId) {
    logger.warn('No client ID provided for IP validation', { pathname });
    // For non-exception routes without client ID, deny access
    return { allowed: false, reason: 'no_client_id' };
  }
  
  // Extract client IP
  const clientIP = getClientIP(req);

  console.log(clientIP,"ipAddress");
  
  
  // Check if IP is whitelisted
  const isWhitelisted = await isIPWhitelisted(supabase, clientId, clientIP);
  
  if (!isWhitelisted) {
    return { 
      allowed: false, 
      reason: 'ip_not_whitelisted',
      // Don't expose client IP in response for security
    };
  }
  
  return { allowed: true };
}

