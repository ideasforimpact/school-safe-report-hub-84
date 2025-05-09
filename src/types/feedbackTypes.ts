
import { SubmissionStatus, FormQuestion, FormResponse as ResponseItem } from '@/contexts/feedback/types';

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissions: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  submitterName: string;
  submitterEmail?: string;
  anonymousSubmission?: boolean;
  answers: ResponseItem[];
  status: SubmissionStatus;
  submittedAt: string;
}
