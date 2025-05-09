
import { v4 as uuidv4 } from 'uuid';
import { AssessmentTemplate, AssessmentAssignment, AssessmentResponse } from '@/types/assessment';

// Create mock template
const createMockTemplates = (): AssessmentTemplate[] => {
  return [
    {
      id: "template-safety-001",
      title: 'Monthly Safety Inspection',
      description: 'Complete this safety inspection checklist to ensure compliance with safety standards.',
      type: 'Safety',
      questions: [
        {
          id: "question-001",
          text: 'Are all emergency exits clearly marked and accessible?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: "question-002",
          text: 'Are fire extinguishers available and properly maintained?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: "question-003",
          text: 'Is the first aid kit fully stocked and easily accessible?',
          allowComments: true,
          allowAttachments: false,
          required: true
        },
        {
          id: "question-004",
          text: 'Are all hazardous materials properly stored and labeled?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: "question-005",
          text: 'Are all walkways and work areas free of trip hazards?',
          allowComments: true,
          allowAttachments: true,
          required: true
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      createdBy: 'admin',
      isActive: true
    },
    {
      id: "template-compliance-001",
      title: 'Compliance Audit',
      description: 'This audit ensures all school policies meet regulatory requirements.',
      type: 'Compliance',
      questions: [
        {
          id: "question-101",
          text: 'Are all required policies posted in visible locations?',
          allowComments: true,
          allowAttachments: true,
          required: true
        },
        {
          id: "question-102",
          text: 'Have all staff completed mandatory safety training?',
          allowComments: true,
          allowAttachments: false,
          required: true
        },
        {
          id: "question-103",
          text: 'Are incident reporting procedures followed consistently?',
          allowComments: true,
          allowAttachments: false,
          required: true
        }
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      createdBy: 'admin',
      isActive: true
    }
  ];
};

// Create mock assignments
const createMockAssignments = (templates: AssessmentTemplate[]): AssessmentAssignment[] => {
  const today = new Date();
  
  // Set due dates
  const dueDateSoon = new Date();
  dueDateSoon.setDate(today.getDate() + 3);
  
  const dueDateLater = new Date();
  dueDateLater.setDate(today.getDate() + 14);
  
  const pastDueDate = new Date();
  pastDueDate.setDate(today.getDate() - 5);
  
  return [
    // Assignment for current user - Pending (due soon)
    {
      id: "assignment-001",
      templateId: templates[0].id,
      userId: '3', // Match this to the logged-in user ID for demo purposes
      userName: 'Jeff Davis',
      dueDate: dueDateSoon.toISOString(),
      assignedDate: today.toISOString(),
      assignedBy: 'admin',
      status: 'Pending'
    },
    // Assignment for current user - In Progress
    {
      id: "assignment-002",
      templateId: templates[1].id,
      userId: '3', // Match this to the logged-in user ID for demo purposes
      userName: 'Jeff Davis',
      dueDate: dueDateLater.toISOString(),
      assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      assignedBy: 'admin',
      status: 'In Progress'
    },
    // Assignment for current user - Overdue
    {
      id: "assignment-003",
      templateId: templates[0].id, 
      userId: '3', // Match this to the logged-in user ID for demo purposes
      userName: 'Jeff Davis',
      dueDate: pastDueDate.toISOString(),
      assignedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      assignedBy: 'admin',
      status: 'Pending' // This will show as overdue due to the past due date
    },
    // Assignment for another user - Completed (for admin view)
    {
      id: "assignment-004",
      templateId: templates[0].id,
      userId: '2',
      userName: 'John Smith',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      assignedBy: 'admin',
      status: 'Completed'
    }
  ];
};

// Create partial response for the "In Progress" assignment
const createMockResponses = (assignments: AssessmentAssignment[]): AssessmentResponse[] => {
  const inProgressAssignment = assignments.find(a => a.status === 'In Progress');
  const completedAssignment = assignments.find(a => a.status === 'Completed');
  
  const responses = [];
  
  if (inProgressAssignment) {
    // Partial response for the in-progress assignment
    responses.push({
      id: uuidv4(),
      assignmentId: inProgressAssignment.id,
      templateId: inProgressAssignment.templateId,
      userId: inProgressAssignment.userId,
      completedDate: null,
      responses: [
        {
          questionId: "question-101", // Adjust this to match an actual question ID
          answer: true,
          comment: "All policies are posted in the main office and staff room.",
          attachments: null
        },
        {
          questionId: "question-102", // Adjust this to match an actual question ID
          answer: false,
          comment: "Three staff members still need to complete their training.",
          attachments: null
        }
      ],
      status: 'Draft',
      score: null
    });
  }
  
  if (completedAssignment) {
    // Full response for the completed assignment
    responses.push({
      id: uuidv4(),
      assignmentId: completedAssignment.id,
      templateId: completedAssignment.templateId,
      userId: completedAssignment.userId,
      completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      responses: [
        {
          questionId: "question-001",
          answer: true,
          comment: "All exits are properly marked and clear.",
          attachments: null
        },
        {
          questionId: "question-002",
          answer: true,
          comment: "Fire extinguishers were checked last month.",
          attachments: null
        },
        {
          questionId: "question-003",
          answer: true,
          comment: "First aid kit is fully stocked.",
          attachments: null
        },
        {
          questionId: "question-004",
          answer: true,
          comment: "All chemicals properly labeled and stored in locked cabinets.",
          attachments: null
        },
        {
          questionId: "question-005",
          answer: true,
          comment: "No trip hazards observed.",
          attachments: null
        }
      ],
      status: 'Submitted',
      score: 100
    });
  }
  
  return responses;
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
  
  // Create assignments based on the templates
  const assignments = createMockAssignments(templates);
  localStorage.setItem('assessmentAssignments', JSON.stringify(assignments));
  
  // Create partial responses
  const responses = createMockResponses(assignments);
  localStorage.setItem('assessmentResponses', JSON.stringify(responses));
  
  console.log('Mock assessment data initialized with predictable IDs for demo');
};
