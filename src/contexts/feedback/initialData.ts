
import { FeedbackForm, FormSubmission, FormQuestion } from './types';

// Sample form questions
const sampleQuestions: FormQuestion[] = [
  {
    id: "q1",
    text: "How satisfied were you with our service?",
    type: "radio",
    required: true,
    options: ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  {
    id: "q2",
    text: "Please share any additional comments or suggestions.",
    type: "text",
    required: false,
    options: []
  }
];

// Initial feedback forms data
export const initialForms: FeedbackForm[] = [
  {
    id: "form_1",
    title: "Customer Service Feedback",
    description: "Help us improve our customer service by providing your feedback.",
    questions: sampleQuestions,
    isActive: true,
    createdAt: "2023-09-15T08:00:00Z",
    updatedAt: "2023-09-15T08:00:00Z",
    submissions: 12
  },
  {
    id: "form_2",
    title: "Incident Report Feedback",
    description: "Share your experience with our incident reporting process.",
    questions: [
      {
        id: "q1",
        text: "Was the incident reporting process clear?",
        type: "radio",
        required: true,
        options: ["Yes", "Somewhat", "No"]
      },
      {
        id: "q2",
        text: "How can we improve the incident reporting process?",
        type: "text",
        required: false,
        options: []
      }
    ],
    isActive: true,
    createdAt: "2023-10-01T14:30:00Z",
    updatedAt: "2023-10-01T14:30:00Z",
    submissions: 5
  }
];

// Initial form submissions data
export const initialSubmissions: FormSubmission[] = [
  {
    id: "response_1",
    formId: "form_1",
    formTitle: "Customer Service Feedback",
    submitterName: "John Doe",
    submitterEmail: "john.doe@example.com",
    responses: [
      { question: "How satisfied were you with our service?", answer: "Satisfied" },
      { question: "Please share any additional comments or suggestions.", answer: "The response time was excellent, but I would like more detailed follow-ups." }
    ],
    status: "new",
    createdAt: "2023-09-20T10:15:00Z",
    updatedAt: "2023-09-20T10:15:00Z"
  },
  {
    id: "response_2",
    formId: "form_2",
    formTitle: "Incident Report Feedback",
    submitterName: "Jane Smith",
    submitterEmail: "jane.smith@example.com",
    responses: [
      { question: "Was the incident reporting process clear?", answer: "Somewhat" },
      { question: "How can we improve the incident reporting process?", answer: "The form was too long and some fields were confusing." }
    ],
    status: "in_progress",
    createdAt: "2023-10-05T09:45:00Z",
    updatedAt: "2023-10-05T11:20:00Z"
  }
];
