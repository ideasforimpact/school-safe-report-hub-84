
export type FormQuestionType = 'text' | 'checkbox' | 'radio';

export interface FormQuestion {
  id: string;
  text: string;
  type: FormQuestionType;
  required: boolean;
  options: string[];
}

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
  question: string;
  answer: string;
}

export type SubmissionStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submitterName: string;
  submitterEmail?: string;
  responses: FormResponse[];
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackContextType {
  forms: FeedbackForm[];
  submissions: FormSubmission[];
  getFormById: (id: string) => FeedbackForm | undefined;
  getResponseById: (id: string) => FormSubmission | undefined;
  addForm: (form: FeedbackForm) => void;
  updateForm: (form: FeedbackForm) => void;
  deleteForm: (formId: string) => void;
  addSubmission: (submission: FormSubmission) => void;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
  submitFormResponse: (response: Omit<FormSubmission, 'id' | 'submittedAt'>) => void;
}
