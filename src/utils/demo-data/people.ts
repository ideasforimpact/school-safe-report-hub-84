
import { Person, UserRef } from '@/types/incident';

// Create a pool of fictional people to use across incidents
export const studentPool: Person[] = [
  { name: 'James Wilson', role: 'Student', notes: 'Grade 5' },
  { name: 'Emily Martinez', role: 'Student', notes: 'Grade 7' },
  { name: 'Michael Johnson', role: 'Student', notes: 'Grade 10' },
  { name: 'Sophia Lee', role: 'Student', notes: 'Grade 3' },
  { name: 'Ethan Brown', role: 'Student', notes: 'Grade 8' },
  { name: 'Olivia Davis', role: 'Student', notes: 'Grade 6' },
  { name: 'Noah Smith', role: 'Student', notes: 'Grade 12' },
  { name: 'Ava Taylor', role: 'Student', notes: 'Grade 9' },
  { name: 'William Anderson', role: 'Student', notes: 'Grade 11' },
  { name: 'Isabella Thomas', role: 'Student', notes: 'Grade 4' },
  { name: 'Benjamin Harris', role: 'Student', notes: 'Grade 7' },
  { name: 'Mia Rodriguez', role: 'Student', notes: 'Grade 5' },
  { name: 'Jacob Lewis', role: 'Student', notes: 'Grade 10' },
  { name: 'Charlotte Walker', role: 'Student', notes: 'Grade 8' },
  { name: 'Alexander Hall', role: 'Student', notes: 'Grade 9' },
  { name: 'Amelia Allen', role: 'Student', notes: 'Grade 6' },
  { name: 'Daniel Young', role: 'Student', notes: 'Grade 5' },
  { name: 'Sofia King', role: 'Student', notes: 'Grade 11' },
  { name: 'Matthew Wright', role: 'Student', notes: 'Grade 8' },
  { name: 'Abigail Scott', role: 'Student', notes: 'Grade 4' },
  { name: 'David Green', role: 'Student', notes: 'Grade 7' },
  { name: 'Harper Baker', role: 'Student', notes: 'Grade 12' },
  { name: 'Joseph Adams', role: 'Student', notes: 'Grade 9' },
  { name: 'Evelyn Nelson', role: 'Student', notes: 'Grade 6' },
  { name: 'Samuel Carter', role: 'Student', notes: 'Grade 10' }
];

export const staffPool: Person[] = [
  { name: 'Ms. Roberts', role: 'Staff', notes: 'English Teacher' },
  { name: 'Mr. Phillips', role: 'Staff', notes: 'Math Teacher' },
  { name: 'Mrs. Campbell', role: 'Staff', notes: 'Science Teacher' },
  { name: 'Dr. Parker', role: 'Staff', notes: 'Principal' },
  { name: 'Ms. Evans', role: 'Staff', notes: 'School Counselor' },
  { name: 'Mr. Turner', role: 'Staff', notes: 'Physical Education Teacher' },
  { name: 'Mrs. Brooks', role: 'Staff', notes: 'Art Teacher' },
  { name: 'Mr. Bennett', role: 'Staff', notes: 'History Teacher' },
  { name: 'Ms. Wood', role: 'Staff', notes: 'School Nurse' },
  { name: 'Mr. Butler', role: 'Staff', notes: 'Technology Coordinator' },
  { name: 'Mrs. Simmons', role: 'Staff', notes: 'Librarian' },
  { name: 'Mr. Gray', role: 'Staff', notes: 'Custodian' },
  { name: 'Ms. Howard', role: 'Staff', notes: 'Cafeteria Manager' }
];

export const otherPool: Person[] = [
  { name: 'John Doe', role: 'Other', notes: 'Parent' },
  { name: 'Mary Johnson', role: 'Other', notes: 'Parent' },
  { name: 'Tom Smith', role: 'Other', notes: 'Visitor' },
  { name: 'Sarah Williams', role: 'Other', notes: 'Contractor' },
  { name: 'Robert Brown', role: 'Other', notes: 'School Board Member' },
  { name: 'Patricia Miller', role: 'Other', notes: 'Volunteer' },
  { name: 'Mark Davis', role: 'Other', notes: 'Bus Driver' },
  { name: 'Jennifer Wilson', role: 'Other', notes: 'Parent' },
  { name: 'Charles Moore', role: 'Other', notes: 'Substitute Teacher' },
  { name: 'Linda Taylor', role: 'Other', notes: 'Guest Speaker' },
  { name: 'Richard Thomas', role: 'Other', notes: 'Parent' },
  { name: 'Susan Anderson', role: 'Other', notes: 'PTA Member' }
];

// User references (staff who can report/own incidents)
export const userRefs: UserRef[] = [
  { id: '1', name: 'Admin User' },
  { id: '2', name: 'Teacher Reporter' },
  { id: '3', name: 'Safety Officer' },
  { id: '4', name: 'Maintenance Staff' },
  { id: '5', name: 'Principal Johnson' },
  { id: '6', name: 'Nurse Smith' },
  { id: '7', name: 'Coach Williams' },
  { id: '8', name: 'IT Specialist Rogers' },
  { id: '9', name: 'Counselor Martinez' }
];
