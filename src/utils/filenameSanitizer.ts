/**
 * Centralized filename sanitization utility to handle special characters
 * that cause "Invalid key" errors in Supabase Storage
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';

  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';
  
  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }

  // Sanitize the name part (keep extension as-is)
  const sanitizedName = name
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Replace parentheses with underscores
    .replace(/[()]/g, '_')
    // Replace em dash, en dash, and other special dashes with regular hyphen
    .replace(/[—–]/g, '-')
    // Replace other problematic characters but keep alphanumeric, hyphens, underscores, and periods
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    // Remove multiple consecutive underscores/hyphens
    .replace(/[_-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  return sanitizedName + extension;
};

/**
 * Generate a unique filename with timestamp and random suffix
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Split to add timestamp before extension
  const lastDotIndex = sanitized.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const name = sanitized.substring(0, lastDotIndex);
    const extension = sanitized.substring(lastDotIndex);
    return `${timestamp}_${randomSuffix}_${name}${extension}`;
  }
  
  return `${timestamp}_${randomSuffix}_${sanitized}`;
};
