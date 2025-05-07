
import { GrievanceForm, FormSubmission } from './types';

export const initialForms: GrievanceForm[] = [
  {
    id: 'form_123456',
    title: 'School Grievance Form',
    description: 'Use this form to submit any complaints or concerns about school-related matters',
    questions: [
      {
        id: 'q_1',
        text: 'What type of grievance would you like to report?',
        type: 'radio',
        required: true,
        options: ['Academic', 'Administrative', 'Facilities', 'Staff Conduct', 'Student Conduct', 'Safety Concerns', 'Other']
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
        text: 'Where did this issue occur?',
        type: 'text',
        required: false,
        options: []
      },
      {
        id: 'q_4',
        text: 'Please describe the situation in detail',
        type: 'text',
        required: true,
        options: []
      },
      {
        id: 'q_5',
        text: 'Have you reported this issue before?',
        type: 'radio',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: 'q_6',
        text: 'What resolution are you seeking?',
        type: 'text',
        required: false,
        options: []
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
    id: 'sub_789012',
    formId: 'form_123456',
    formTitle: 'School Grievance Form',
    submitterName: 'Jane Smith',
    submitterEmail: 'jane@example.com',
    responses: [
      {
        question: 'Role',
        answer: 'student'
      },
      {
        question: 'Phone',
        answer: '555-123-4567'
      },
      {
        question: 'Grievance Type',
        answer: 'Facilities'
      },
      {
        question: 'Date of Incident',
        answer: '2023-04-15'
      },
      {
        question: 'Location',
        answer: 'School Cafeteria'
      },
      {
        question: 'Description of Grievance',
        answer: 'The cafeteria has been consistently out of vegetarian options for the past two weeks. As a vegetarian student, I have had very limited food choices during lunch periods. This issue affects several students who have dietary restrictions.'
      },
      {
        question: 'Previously Reported',
        answer: 'No'
      },
      {
        question: 'Desired Outcome',
        answer: 'I would like to see consistent vegetarian options available daily in the cafeteria menu.'
      },
      {
        question: 'Preferred Contact',
        answer: 'Email'
      },
      {
        question: 'Keep Confidential',
        answer: 'No'
      }
    ],
    status: 'new',
    createdAt: '2023-04-20T10:30:00Z',
    updatedAt: '2023-04-20T10:30:00Z'
  },
  {
    id: 'sub_345678',
    formId: 'form_123456',
    formTitle: 'School Grievance Form',
    submitterName: 'Robert Johnson',
    submitterEmail: 'robert@example.com',
    responses: [
      {
        question: 'Role',
        answer: 'teacher'
      },
      {
        question: 'Phone',
        answer: '555-987-6543'
      },
      {
        question: 'Grievance Type',
        answer: 'Administrative'
      },
      {
        question: 'Date of Incident',
        answer: '2023-03-10'
      },
      {
        question: 'Location',
        answer: 'Admin Office'
      },
      {
        question: 'Description of Grievance',
        answer: 'There has been a consistent delay in processing reimbursement requests for classroom supplies. I submitted a request over 60 days ago and still have not received reimbursement. This places financial burden on teachers who are purchasing necessary materials for their classrooms.'
      },
      {
        question: 'Previously Reported',
        answer: 'Yes'
      },
      {
        question: 'Desired Outcome',
        answer: 'I would like to receive my pending reimbursement and see the process improved to ensure teachers receive timely reimbursements in the future.'
      },
      {
        question: 'Preferred Contact',
        answer: 'Both'
      },
      {
        question: 'Keep Confidential',
        answer: 'Yes'
      }
    ],
    status: 'in_progress',
    createdAt: '2023-03-15T14:45:00Z',
    updatedAt: '2023-03-16T09:20:00Z'
  }
];
