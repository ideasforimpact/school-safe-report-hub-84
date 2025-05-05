
/**
 * Extract a simple numeric ID from a ticket ID string
 * @param ticketId The full ticket ID (e.g., "SR-1234")
 * @returns A simpler ID between 1-1000
 */
export const getSimpleId = (ticketId: string): string => {
  // Extract numbers from the ticket ID and convert to number
  const numbers = ticketId.match(/\d+/g);
  if (!numbers || numbers.length === 0) return "1";
  
  // Get the first number and ensure it's between 1 and 1000
  const idNumber = parseInt(numbers[0], 10) % 1000;
  return idNumber === 0 ? "1000" : idNumber.toString();
};
