
import { FormSubmission } from './types';

// Initial submissions data
export const initialSubmissions: FormSubmission[] = [
  {
    id: 'gs_1',
    submitterName: 'John Doe',
    submitterEmail: 'john.doe@example.com',
    responses: [
      {
        question: 'Grievance Heading',
        answer: 'Classroom Cleanliness Issue'
      },
      {
        question: 'Description of Grievance',
        answer: 'The classrooms in Building A have not been properly cleaned for the past week. There is visible dust and waste paper on the floor, and this is affecting student health.'
      },
      {
        question: 'What action or resolution do you expect?',
        answer: 'Regular cleaning schedule to be implemented and maintained.'
      }
    ],
    status: 'new',
    needsFollowup: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'gs_2',
    submitterName: 'Jane Smith',
    submitterEmail: 'jane.smith@example.com',
    responses: [
      {
        question: 'Grievance Heading',
        answer: 'Cafeteria Food Quality'
      },
      {
        question: 'Description of Grievance',
        answer: 'The food quality in the cafeteria has significantly declined. Many students have reported stomachaches after eating lunch, and the portion sizes have been reduced without notice.'
      },
      {
        question: 'What action or resolution do you expect?',
        answer: 'Review of food quality standards and better oversight of cafeteria operations.'
      }
    ],
    status: 'in_progress',
    needsFollowup: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'gs_3',
    submitterName: 'Anonymous',
    submitterEmail: '',
    responses: [
      {
        question: 'Grievance Heading',
        answer: 'Bullying Incident'
      },
      {
        question: 'Description of Grievance',
        answer: 'There have been repeated incidents of bullying in the 8th grade section that have not been addressed by the teachers. This is creating a hostile environment for several students.'
      },
      {
        question: 'What action or resolution do you expect?',
        answer: 'Implementation of anti-bullying measures and teacher training on recognizing and addressing bullying.'
      }
    ],
    status: 'resolved',
    needsFollowup: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];
