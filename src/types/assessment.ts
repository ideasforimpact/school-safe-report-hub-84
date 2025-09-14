
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
  answer: boolean; // Yes/No
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
