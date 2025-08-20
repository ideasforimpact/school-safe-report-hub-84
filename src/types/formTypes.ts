
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'file' | 'captcha';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  maxFiles?: number; // For file uploads
  allowedFileTypes?: string[]; // For file uploads
  maxLength?: number; // For text/textarea fields
}

export interface CustomForm {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  fields: FormField[];
  excluded_fields?: string[]; // Array of field IDs to exclude from default fields
  is_active: boolean;
  preview_url: string;
  client_logo?: string; // URL to client logo
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  submitter_name?: string;
  submitter_email?: string;
  submitter_phone?: string;
  submitter_type?: 'parent' | 'student' | 'staff' | 'other';
  responses: Record<string, any>; // Field ID -> Response value
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  comments?: string;
  created_at: string;
  updated_at: string;
}

// Default grievance form fields
export const DEFAULT_GRIEVANCE_FIELDS: FormField[] = [
  {
    id: 'subject',
    type: 'text',
    label: 'Subject / Title of Grievance',
    required: true,
    placeholder: 'Enter a brief summary of your grievance',
    maxLength: 200
  },
  {
    id: 'name',
    type: 'text',
    label: 'Name',
    required: false,
    placeholder: 'Your full name'
  },
  {
    id: 'phone',
    type: 'phone',
    label: 'Phone Number',
    required: false,
    placeholder: 'Your phone number'
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email',
    required: false,
    placeholder: 'Your email address'
  },
  {
    id: 'submitter_type',
    type: 'select',
    label: 'Who is raising this grievance?',
    required: true,
    options: ['Parent', 'Student', 'Staff', 'Other']
  },
  {
    id: 'description',
    type: 'textarea',
    label: 'Description of the grievance',
    required: true,
    placeholder: 'Please provide a detailed description of your grievance...',
    maxLength: 2000
  },
  {
    id: 'attachments',
    type: 'file',
    label: 'Attachments',
    required: false,
    maxFiles: 5,
    allowedFileTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'captcha',
    type: 'captcha',
    label: 'Captcha Verification',
    required: true
  }
];
