
// Function to generate ticket IDs
export const generateTicketId = (): string => {
  const prefix = "SR"; // Safety Report prefix
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 random digits
  return `${prefix}-${timestamp}-${randomDigits}`;
};

// Sample users for the demo
export const sampleUsers = [
  { id: '1', name: 'Admin User', role: 'Admin' },
  { id: '2', name: 'Teacher Reporter', role: 'Teacher' },
  { id: '3', name: 'Safety Officer', role: 'Safety Officer' },
  { id: '4', name: 'Maintenance Staff', role: 'Staff' },
];

// Generate sample incidents for demo purposes
export const generateSampleIncidents = () => {
  const pastDays = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: '1',
      ticketId: 'SR-123456-001',
      type: 'Incident',
      category: 'Physical Injury',
      subcategory: 'Playground or sports injury',
      description: 'Student fell during recess and scraped knee',
      rootCause: 'Uneven playground surface and lack of proper supervision',
      date: pastDays(2),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'John Doe', role: 'Student', notes: 'Grade 5' }
      ],
      status: 'Closed',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      owner: { id: '3', name: 'Safety Officer' },
      facility: 'Playground',
      actions: [
        { description: 'First aid administered, parent notified', responsiblePerson: 'Nurse Smith', date: pastDays(2) }
      ],
      actionItems: [
        {
          id: '1',
          description: 'Update playground safety guidelines',
          dueDate: pastDays(-5), // 5 days in the future
          assignedTo: { id: '3', name: 'Safety Officer' },
          status: 'In Progress',
          createdBy: { id: '1', name: 'Admin User' },
          createdAt: pastDays(2),
          updatedAt: pastDays(2)
        }
      ],
      priority: 'Medium',
      createdAt: pastDays(2),
      updatedAt: pastDays(1)
    },
    {
      id: '2',
      ticketId: 'SR-123457-002',
      type: 'Near Miss',
      category: 'Property Damage',
      subcategory: 'Damage to lab/sports/classroom equipment',
      description: 'Ceiling tile nearly fell in hallway',
      rootCause: 'Water damage from previous roof leak weakened the ceiling structure',
      date: pastDays(5),
      location: 'On Campus',
      peopleInvolved: [],
      status: 'In Progress',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      owner: { id: '4', name: 'Maintenance Staff' },
      facility: 'Main Building',
      actions: [
        { description: 'Maintenance notified, area cordoned off', responsiblePerson: 'Janitor Brown', date: pastDays(5) }
      ],
      priority: 'High',
      createdAt: pastDays(5),
      updatedAt: pastDays(4)
    },
    {
      id: '3',
      ticketId: 'SR-123458-003',
      type: 'Unsafe Condition',
      category: 'Health Concern',
      subcategory: 'Suspected communicable disease',
      description: 'Mold spotted in corner of gymnasium',
      date: pastDays(10),
      location: 'On Campus',
      peopleInvolved: [],
      status: 'Open',
      reportedBy: { id: '1', name: 'Admin User' },
      priority: 'Medium',
      createdAt: pastDays(10),
      updatedAt: pastDays(10)
    },
    {
      id: '4',
      ticketId: 'SR-123459-004',
      type: 'Incident',
      category: 'Bullying',
      subcategory: 'Name-calling, teasing, mocking',
      description: 'Verbal altercation between students',
      date: pastDays(1),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'Student A', role: 'Student' },
        { name: 'Student B', role: 'Student' }
      ],
      status: 'Open',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      priority: 'High',
      createdAt: pastDays(1),
      updatedAt: pastDays(1)
    },
    {
      id: '5',
      ticketId: 'SR-123460-005',
      type: 'Incident',
      category: 'Tech Misuse',
      subcategory: 'Using phone or laptop without permission',
      description: 'Student accessing inappropriate content on school device',
      date: pastDays(3),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'Student C', role: 'Student' }
      ],
      status: 'In Progress',
      reportedBy: { id: '1', name: 'Admin User' },
      actions: [
        { description: 'Device confiscated, parent meeting scheduled', responsiblePerson: 'IT Admin', date: pastDays(3) }
      ],
      priority: 'Low',
      createdAt: pastDays(3),
      updatedAt: pastDays(2)
    }
  ];
};
