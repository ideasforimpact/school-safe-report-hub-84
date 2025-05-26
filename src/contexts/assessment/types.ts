
import { 
  AssessmentTemplate, 
  AssessmentAssignment, 
  AssessmentResponse, 
  AssessmentQuestion 
} from '@/types/assessment';

export interface AssessmentContextType {
  // Templates
  templates: AssessmentTemplate[];
  createTemplate: (template: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => AssessmentTemplate | undefined;
  
  // Questions
  addQuestion: (templateId: string, question: Omit<AssessmentQuestion, 'id'>) => string;
  updateQuestion: (templateId: string, questionId: string, updates: Partial<Omit<AssessmentQuestion, 'id'>>) => void;
  removeQuestion: (templateId: string, questionId: string) => void;
  
  // Assignments
  assignments: AssessmentAssignment[];
  createAssignment: (assignment: Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy' | 'status'>) => string;
  updateAssignment: (id: string, updates: Partial<Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy'>>) => void;
  deleteAssignment: (id: string) => void;
  getUserAssignments: (userId: string) => AssessmentAssignment[];
  
  // Responses
  responses: AssessmentResponse[];
  createResponse: (response: Omit<AssessmentResponse, 'id' | 'completedDate' | 'status' | 'score'>) => string;
  updateResponse: (id: string, updates: Partial<Omit<AssessmentResponse, 'id'>>) => void;
  submitResponse: (id: string) => void;
  getResponsesByAssignment: (assignmentId: string) => AssessmentResponse[];
  getResponsesByUser: (userId: string) => AssessmentResponse[];
}
