
// Function to generate ticket IDs
export const generateTicketId = (): string => {
  const prefix = "SR"; // Safety Report prefix
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 random digits
  return `${prefix}-${timestamp}-${randomDigits}`;
};

// Sample users for the demo - updated to match the User type exactly
export const sampleUsers = [
  { id: '1', name: 'Admin User', role: 'Admin' as const },
  { id: '2', name: 'Teacher Reporter', role: 'Teacher' as const },
  { id: '3', name: 'Safety Officer', role: 'Safety Officer' as const },
  { id: '4', name: 'Maintenance Staff', role: 'Staff' as const },
];
