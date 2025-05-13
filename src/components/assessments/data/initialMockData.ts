
import { v4 as uuidv4 } from 'uuid';
import { AssessmentTemplate, AssessmentAssignment, AssessmentResponse } from '@/types/assessment';

// Create mock template
const createMockTemplates = (): AssessmentTemplate[] => {
  const templateId = uuidv4();
  
  return [
    {
      id: templateId,
      title: 'Monthly Safety Inspection',
      description: 'Complete this safety inspection checklist to ensure compliance with safety standards.',
      type: 'Safety',
      questions: [
        {
          id: uuidv4(),
          text: 'Are all emergency exits clearly marked and accessible?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: uuidv4(),
          text: 'Are fire extinguishers available and properly maintained?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: uuidv4(),
          text: 'Is the first aid kit fully stocked and easily accessible?',
          allowComments: true,
          allowAttachments: false,
          required: true
        },
        {
          id: uuidv4(),
          text: 'Are all hazardous materials properly stored and labeled?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: uuidv4(),
          text: 'Are all walkways and work areas free of trip hazards?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: uuidv4(),
          text: 'Is personal protective equipment available and in good condition?',
          allowComments: true,
          allowAttachments: false,
          required: true
        },
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      createdBy: 'admin',
      isActive: true
    }
  ];
};

// Create mock assignments - use a specific ID for demo purposes
const createMockAssignments = (templateId: string): AssessmentAssignment[] => {
  const today = new Date();
  
  // Set due date to 7 days from now
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 7);
  
  // Use a specific ID for the first assignment to make it easily accessible
  // This ID will be predictable for demo purposes: c689a45d-9111-4d77-9d74-416fbd7ca233
  return [
    {
      id: "c689a45d-9111-4d77-9d74-416fbd7ca233",
      templateId,
      userId: 'user1',
      userName: 'John Doe',
      dueDate: dueDate.toISOString(),
      assignedDate: today.toISOString(),
      assignedBy: 'admin',
      status: 'Pending'
    },
    {
      id: uuidv4(),
      templateId,
      userId: 'user2',
      userName: 'Jane Smith',
      dueDate: dueDate.toISOString(),
      assignedDate: today.toISOString(),
      assignedBy: 'admin',
      status: 'Pending'
    }
  ];
};

// Initialize mock data if none exists
export const initializeMockData = () => {
  // Clear existing mock data for development purposes to ensure consistent IDs
  localStorage.removeItem('assessmentTemplates');
  localStorage.removeItem('assessmentAssignments');
  localStorage.removeItem('assessmentResponses');

  // Create new templates
  const templates = createMockTemplates();
  localStorage.setItem('assessmentTemplates', JSON.stringify(templates));
  
  // Create assignments based on the template
  if (templates.length > 0) {
    const assignments = createMockAssignments(templates[0].id);
    localStorage.setItem('assessmentAssignments', JSON.stringify(assignments));
  }
  
  // Initialize empty responses array
  localStorage.setItem('assessmentResponses', JSON.stringify([]));
  
  console.log('Mock assessment data initialized with predictable IDs for demo');
};
