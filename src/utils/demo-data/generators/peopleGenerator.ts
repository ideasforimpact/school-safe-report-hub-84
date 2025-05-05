
import { Person } from '@/types/incident';
import { studentPool, staffPool, otherPool } from '../dataPools';
import { getRandomItem, getRandomItems } from '../randomUtils';

// Helper function to generate people involved in an incident
export const generatePeopleInvolved = (category: string): Person[] => {
  const peopleInvolved: Person[] = [];
  const peopleCount = Math.floor(Math.random() * 3) + 1; // 1-3 people
  
  // Different mix based on incident type
  if (category === 'Bullying' || category === 'Physical Injury') {
    // Mostly students
    peopleInvolved.push(...getRandomItems(studentPool, peopleCount));
    if (Math.random() < 0.3) { // 30% chance of staff involvement
      peopleInvolved.push(getRandomItem(staffPool));
    }
  } else if (category === 'Property Damage' || category === 'Tech Misuse') {
    // Mix of students and staff
    peopleInvolved.push(...getRandomItems(studentPool, Math.ceil(peopleCount/2)));
    if (Math.random() < 0.5) { // 50% chance of staff involvement
      peopleInvolved.push(getRandomItem(staffPool));
    }
  } else if (category === 'Security Breach') {
    // More likely to involve others
    if (Math.random() < 0.6) { // 60% chance of other involvement
      peopleInvolved.push(getRandomItem(otherPool));
    }
    if (Math.random() < 0.3) { // 30% chance of student involvement
      peopleInvolved.push(getRandomItem(studentPool));
    }
    peopleInvolved.push(getRandomItem(staffPool)); // Always involve staff
  } else {
    // Random mix for other categories
    if (Math.random() < 0.7) peopleInvolved.push(getRandomItem(studentPool));
    if (Math.random() < 0.5) peopleInvolved.push(getRandomItem(staffPool));
    if (Math.random() < 0.2) peopleInvolved.push(getRandomItem(otherPool));
  }
  
  // Ensure at least one person involved
  if (peopleInvolved.length === 0) {
    peopleInvolved.push(getRandomItem(studentPool));
  }
  
  return peopleInvolved;
};
