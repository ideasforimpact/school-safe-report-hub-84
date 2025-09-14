/**
 * Utility functions for client-related operations
 */

/**
 * Formats a client name to generate a ticket ID prefix
 * Rules:
 * - If single word: Use first 3 characters (capitalized)
 * - If multiple words: Use first letter of each word (capitalized)
 * 
 * Examples:
 * - "PSG Vidhyalaya Martic School" -> "PVMS"
 * - "ABC Company" -> "AC"
 * - "Microsoft" -> "MIC"
 * - "Apple Inc" -> "AI"
 */
export const formatClientNameForTicketId = (clientName: string): string => {
  if (!clientName || typeof clientName !== 'string') {
    return 'CLI'; // Default fallback
  }

  // Clean the client name (remove extra spaces, special characters)
  const cleanName = clientName.trim().replace(/[^a-zA-Z\s]/g, '');
  
  // Split into words
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'CLI'; // Fallback if no valid words
  }
  
  if (words.length === 1) {
    // Single word: use first 3 characters
    const word = words[0];
    return word.substring(0, 3).toUpperCase();
  } else {
    // Multiple words: use first letter of each word
    return words.map(word => word.charAt(0).toUpperCase()).join('');
  }
};

/**
 * Generates the next ticket ID for a client
 * Format: {CLIENT_PREFIX}-{INCREMENTAL_NUMBER}
 * 
 * @param clientName - The client name
 * @param existingTicketIds - Array of existing ticket IDs for this client
 * @returns The next ticket ID (e.g., "PVMS-001")
 */
export const generateNextTicketId = (clientName: string, existingTicketIds: string[]): string => {
  const prefix = formatClientNameForTicketId(clientName);
  
  // Filter existing ticket IDs that match this client's prefix
  const clientTicketIds = existingTicketIds.filter(ticketId => 
    ticketId.startsWith(`${prefix}-`)
  );
  
  // Extract numbers from existing ticket IDs
  const numbers = clientTicketIds.map(ticketId => {
    const match = ticketId.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  
  // Find the highest number and increment
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  
  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  return `${prefix}-${formattedNumber}`;
};

/**
 * Validates if a ticket ID follows the correct format
 * @param ticketId - The ticket ID to validate
 * @returns true if valid, false otherwise
 */
export const isValidTicketIdFormat = (ticketId: string): boolean => {
  // Pattern: 2-4 uppercase letters, hyphen, 3 digits
  const pattern = /^[A-Z]{2,4}-\d{3}$/;
  return pattern.test(ticketId);
};

/**
 * Extracts the client prefix from a ticket ID
 * @param ticketId - The ticket ID
 * @returns The client prefix (e.g., "PVMS" from "PVMS-001")
 */
export const extractClientPrefixFromTicketId = (ticketId: string): string => {
  const match = ticketId.match(/^([A-Z]{2,4})-/);
  return match ? match[1] : '';
};

/**
 * Extracts the number from a ticket ID
 * @param ticketId - The ticket ID
 * @returns The number part (e.g., 1 from "PVMS-001")
 */
export const extractNumberFromTicketId = (ticketId: string): number => {
  const match = ticketId.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};
