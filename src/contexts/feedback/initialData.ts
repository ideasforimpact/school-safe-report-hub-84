
import { FeedbackForm, FormSubmission } from './types';

export const initialForms: FeedbackForm[] = [
  {
    id: 'form_123456',
    title: 'General Feedback Form',
    description: 'Please provide your feedback about our services',
    questions: [
      {
        id: 'q_1',
        text: 'How satisfied are you with our service?',
        type: 'radio',
        required: true,
        options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
      },
      {
        id: 'q_2',
        text: 'What aspects of our service do you appreciate?',
        type: 'checkbox',
        required: false,
        options: ['Responsiveness', 'Quality', 'Communication', 'Pricing', 'Customer Support']
      },
      {
        id: 'q_3',
        text: 'Please provide any additional feedback or suggestions',
        type: 'text',
        required: false,
        options: []
      }
    ],
    isActive: true,
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-15T10:30:00Z',
    submissions: 3
  },
  {
    id: 'form_789012',
    title: 'Grievance Report',
    description: 'Submit a detailed grievance report for our team to investigate',
    questions: [
      {
        id: 'q_1',
        text: 'What type of grievance would you like to report?',
        type: 'radio',
        required: true,
        options: ['Service Issue', 'Staff Behavior', 'Facility Problem', 'Policy Concern', 'Other']
      },
      {
        id: 'q_2',
        text: 'When did this issue occur?',
        type: 'text',
        required: true,
        options: []
      },
      {
        id: 'q_3',
        text: 'Please describe the situation in detail',
        type: 'text',
        required: true,
        options: []
      },
      {
        id: 'q_4',
        text: 'Have you reported this issue before?',
        type: 'radio',
        required: true,
        options: ['Yes', 'No']
      }
    ],
    isActive: true,
    createdAt: '2023-05-20T14:45:00Z',
    updatedAt: '2023-05-20T14:45:00Z',
    submissions: 2
  }
];

export const initialSubmissions: FormSubmission[] = [
  {
    id: 'sub_123456',
    formId: 'form_123456',
    formTitle: 'General Feedback Form',
    submitterName: 'John Doe',
    submitterEmail: 'john@example.com',
    responses: [
      {
        question: 'How satisfied are you with our service?',
        answer: 'Satisfied'
      },
      {
        question: 'What aspects of our service do you appreciate?',
        answer: 'Responsiveness, Communication, Customer Support'
      },
      {
        question: 'Please provide any additional feedback or suggestions',
        answer: 'Your team is very responsive and helpful. I would appreciate more flexibility in scheduling.'
      }
    ],
    status: 'new',
    createdAt: '2023-06-01T09:15:00Z',
    updatedAt: '2023-06-01T09:15:00Z'
  },
  {
    id: 'sub_789012',
    formId: 'form_789012',
    formTitle: 'Grievance Report',
    submitterName: 'Jane Smith',
    submitterEmail: 'jane@example.com',
    responses: [
      {
        question: 'What type of grievance would you like to report?',
        answer: 'Service Issue'
      },
      {
        question: 'When did this issue occur?',
        answer: 'June 2, 2023'
      },
      {
        question: 'Please describe the situation in detail',
        answer: 'I requested assistance with my application on June 2nd but did not receive a response for over two weeks. This delay has caused significant issues with my enrollment process.'
      },
      {
        question: 'Have you reported this issue before?',
        answer: 'No'
      }
    ],
    status: 'in_progress',
    createdAt: '2023-06-05T14:30:00Z',
    updatedAt: '2023-06-06T10:20:00Z'
  },
  {
    id: 'sub_345678',
    formId: 'form_123456',
    formTitle: 'General Feedback Form',
    submitterName: 'Robert Johnson',
    submitterEmail: 'robert@example.com',
    responses: [
      {
        question: 'How satisfied are you with our service?',
        answer: 'Very Satisfied'
      },
      {
        question: 'What aspects of our service do you appreciate?',
        answer: 'Quality, Communication'
      },
      {
        question: 'Please provide any additional feedback or suggestions',
        answer: 'The team went above and beyond to meet our requirements. I would definitely recommend your services.'
      }
    ],
    status: 'resolved',
    createdAt: '2023-06-08T11:45:00Z',
    updatedAt: '2023-06-09T13:20:00Z'
  }
];
