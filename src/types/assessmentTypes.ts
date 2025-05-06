
export type AssessmentStatus = 'active' | 'draft' | 'inactive';

export type QuestionType = 'yes_no';

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: QuestionType;
  allowAttachment: boolean;
  required: boolean;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  status: AssessmentStatus;
  questions: AssessmentQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentAssignment {
  id: string;
  templateId: string;
  userId: string;
  dueDate?: Date;
  status: 'assigned' | 'in_progress' | 'completed';
}

export interface AssessmentResponse {
  id: string;
  assignmentId: string;
  questionId: string;
  answer: boolean;
  attachmentUrl?: string;
  notes?: string;
}
