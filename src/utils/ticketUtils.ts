
export const getSimpleId = (ticketId: string): string => {
  if (!ticketId) return 'N/A';
  
  // If it's already in simple format (like 972), return as is
  if (/^\d+$/.test(ticketId)) {
    return ticketId;
  }
  
  // Extract number from INC-XXXXX-XXX format or similar
  const match = ticketId.match(/(\d+)/g);
  if (match && match.length > 0) {
    // Take the first significant number found
    const firstNumber = match[0];
    // If it's too long, take last 3-4 digits
    if (firstNumber.length > 5) {
      return firstNumber.slice(-4);
    }
    return firstNumber;
  }
  
  // Fallback: generate a hash-based number from the string
  let hash = 0;
  for (let i = 0; i < ticketId.length; i++) {
    const char = ticketId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString().slice(-4);
};

export const generateTicketId = (): string => {
  // Generate a simple 3-4 digit number
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return randomNum.toString();
};

export const getFullTicketId = (simpleId: string): string => {
  // Convert simple ID back to full format if needed
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `INC-${timestamp}-${randomPart}`.toUpperCase();
};
