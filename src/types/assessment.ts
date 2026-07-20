
import { User } from '@/contexts/auth/types';

export interface QuestionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  correctAnswer?: string;
  allowComments: boolean;
  allowAttachments: boolean;
  required: boolean;
  files?: QuestionFile[];
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  description: string;
  type: string; // Safety, Compliance, Risk, etc. - for frontend display
  category_id: string; // Database foreign key to template_categories
  questions: AssessmentQuestion[];
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface AssessmentAssignment {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  dueDate: string;
  assignedDate: string;
  assignedBy: string;
  status: 'New' | 'In Progress' | 'Submitted' | 'Completed';
}

export interface AssessmentResponse {
  id: string;
  assignmentId: string;
  templateId: string;
  userId: string;
  completedDate: string | null;
  responses: QuestionResponse[];
  status: 'Draft' | 'Submitted';
  score: number | null;
}

export interface QuestionResponse {
  questionId: string;
  answer: string; // e.g. "yes", "no"
  comment: string | null;
  attachments: FileAttachment[] | null;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface EmployeeDepartment {
  id: string;
  department_name: string;
}

/** Employee shape used by the assessment "Assign To" multi-select and its callers. */
export interface AssigneeEmployee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  aadhar_verified_name?: string | null;
  department?: string | null;
  employee_departments?: EmployeeDepartment | null;
}

/** One assignee of a multi-assignee assessment, as returned by the assessment edge functions. */
export interface AssessmentAssignee {
  id: string;
  name: string;
}
