
export const getSimpleId = (ticketId: string): string => {
  if (!ticketId) return 'N/A';
  
  // If it's already in simple format (like INC-1234), return as is
  if (ticketId.includes('-')) {
    return ticketId;
  }
  
  // If it's a UUID, take the first 8 characters and format
  if (ticketId.length > 10) {
    return `INC-${ticketId.substring(0, 8).toUpperCase()}`;
  }
  
  return ticketId;
};

export const generateTicketId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `INC-${timestamp}-${randomPart}`.toUpperCase();
};
