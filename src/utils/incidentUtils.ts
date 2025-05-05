
// Function to generate ticket IDs
export const generateTicketId = (): string => {
  // Simplified format: SR-[4-digit number]
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SR-${randomDigits}`;
};

// Sample users for the demo - updated to match the User type exactly
export const sampleUsers = [
  { id: '1', name: 'Admin User', role: 'Admin' as const },
  { id: '2', name: 'Teacher Reporter', role: 'Teacher' as const },
  { id: '3', name: 'Safety Officer', role: 'Safety Officer' as const },
  { id: '4', name: 'Maintenance Staff', role: 'Staff' as const },
];
