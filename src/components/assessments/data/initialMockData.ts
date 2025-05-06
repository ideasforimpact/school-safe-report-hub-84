
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

// Create mock assignments
const createMockAssignments = (templateId: string): AssessmentAssignment[] => {
  const today = new Date();
  
  // Set due date to 7 days from now
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 7);
  
  return [
    {
      id: uuidv4(),
      templateId,
      userId: 'user1',
      userName: 'John Doe',
      dueDate: dueDate.toISOString(),
      assignedDate: today.toISOString(),
      assignedBy: 'admin',
      status: 'Pending'
    }
  ];
};

// Initialize mock data if none exists
export const initializeMockData = () => {
  // Check if templates already exist in localStorage
  const storedTemplates = localStorage.getItem('assessmentTemplates');
  const storedAssignments = localStorage.getItem('assessmentAssignments');
  
  // Only initialize if data doesn't exist yet
  if (!storedTemplates || JSON.parse(storedTemplates).length === 0) {
    const templates = createMockTemplates();
    localStorage.setItem('assessmentTemplates', JSON.stringify(templates));
    
    // Create assignments based on the template
    if (templates.length > 0) {
      const assignments = createMockAssignments(templates[0].id);
      localStorage.setItem('assessmentAssignments', JSON.stringify(assignments));
    }
  }
  
  // Initialize empty responses array if none exists
  if (!localStorage.getItem('assessmentResponses')) {
    localStorage.setItem('assessmentResponses', JSON.stringify([]));
  }
};
