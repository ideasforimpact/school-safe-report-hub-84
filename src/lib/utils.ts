
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

  const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL
    || 'https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public';

  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = filePath.replace(/^\//, '');

  return `${normalizedBase}/${bucket}/${normalizedPath}`;
}
