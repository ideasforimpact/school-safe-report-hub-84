
// Submission statuses
export type SubmissionStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

// Response to a form question
export interface FormResponse {
  question: string;
  answer: string;
}

// Form submission
export interface FormSubmission {
  id: string;
  formId?: string; // Optional for backward compatibility
  submitterName: string;
  submitterEmail: string;
  responses: FormResponse[];
  status: SubmissionStatus;
  needsFollowup: boolean;
  createdAt: string;
  updatedAt: string;
}

// Context type
export interface GrievanceContextType {
  submissions: FormSubmission[];
  addSubmission: (submission: FormSubmission) => void;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
}
