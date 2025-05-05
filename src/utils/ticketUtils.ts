
/**
 * Extract a simple numeric ID from a ticket ID string
 * @param ticketId The full ticket ID (e.g., "SR-2025-001")
 * @returns A simpler ID between 1-100
 */
export const getSimpleId = (ticketId: string): string => {
  // Extract all numbers from the ticket ID
  const numbers = ticketId.match(/\d+/g);
  if (!numbers || numbers.length === 0) return "1";
  
  // Get the last number from the extracted numbers (the sequential ID)
  const lastNumber = numbers[numbers.length - 1];
  
  // Parse the number and return it as a string
  const idNumber = parseInt(lastNumber, 10);
  return idNumber.toString();
};
