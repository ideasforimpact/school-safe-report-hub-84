
export type FormQuestionType = 'text' | 'checkbox' | 'radio';

export interface FormQuestion {
  id: string;
  text: string;
  type: FormQuestionType;
  required: boolean;
  options: string[];
}

export interface GrievanceForm {
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

export interface GrievanceContextType {
  forms: GrievanceForm[];
  submissions: FormSubmission[];
  addForm: (form: GrievanceForm) => void;
  updateForm: (form: GrievanceForm) => void;
  deleteForm: (formId: string) => void;
  addSubmission: (submission: FormSubmission) => void;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
}
