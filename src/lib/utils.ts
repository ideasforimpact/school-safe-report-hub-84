
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatRelative, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
}

// Build a public storage URL from a file path stored in DB
// Reads base from env: VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL
// Defaults to current Supabase project base to avoid breaking existing builds
export function buildPublicStorageUrl(filePath: string, bucket: string = 'employee-documents'): string {
  if (!filePath) return '';
  // If already a data URL or absolute URL, return as-is
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL;
  if (!base) {
    throw new Error('VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL is not set');
  }

  const normalizedBase = base.replace(/\/$/, '');
  // Handle paths that already include bucket name (e.g., "client-logos/{clientId}/logo.png")
  let normalizedPath = filePath.replace(/^\//, '');
  
  // If path already includes bucket name, extract just the file path
  if (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.substring(bucket.length + 1);
  } else if (normalizedPath.includes('/') && !normalizedPath.startsWith(bucket)) {
    // Path might be like "client-logos/{id}/logo.png" - extract after bucket name
    const bucketIndex = normalizedPath.indexOf(`${bucket}/`);
    if (bucketIndex !== -1) {
      normalizedPath = normalizedPath.substring(bucketIndex + bucket.length + 1);
    }
  }

  return `${normalizedBase}/${bucket}/${normalizedPath}`;
}

// Helper function to build client logo URL from storage path
export function buildClientLogoUrl(logoPath: string | null | undefined): string | undefined {
  if (!logoPath) return undefined;
  
  // If already a full URL or data URL, return as-is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:')) {
    return logoPath;
  }
  
  // Extract the file path from storage path
  // Handle formats:
  // - "client-logos/{clientId}/logo.png" -> extract "{clientId}/logo.png"
  // - "{clientId}/logo.png" -> use as-is
  let filePath = logoPath;
  if (logoPath.startsWith('client-logos/')) {
    filePath = logoPath.substring('client-logos/'.length);
  }
  
  // Build URL from file path
  const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL;
  if (!base) {
    console.warn('VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL is not set, cannot build logo URL');
    return undefined;
  }
  
  const normalizedBase = base.replace(/\/$/, '');
  const url = `${normalizedBase}/client-logos/${filePath}`;
  
  // Add cache-busting parameter to force browser to fetch fresh image
  // Use a hash of the logo path for consistency, but add timestamp to bust cache on updates
  // The timestamp ensures the browser fetches a fresh image even if the path is the same
  const pathHash = logoPath.split('').reduce((acc, char) => {
    acc = ((acc << 5) - acc) + char.charCodeAt(0);
    return acc & acc;
  }, 0);
  
  // Use hash for path-based caching, but add timestamp to ensure fresh fetch
  // This will cause the image to reload, but it's necessary to show updated logos
  return `${url}?v=${Math.abs(pathHash)}&_=${Date.now()}`;
}
