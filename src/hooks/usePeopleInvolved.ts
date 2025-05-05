
import { useState } from 'react';
import { Person } from '@/types/incident';

export function usePeopleInvolved() {
  // People involved state
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student' as const, id: '', notes: '' }
  ]);

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    
    // If changing the role, clear the name and id fields to start fresh
    if (field === 'role') {
      const typedRole = value as 'Student' | 'Staff' | 'Other';
      updatedPeople[index] = { 
        ...updatedPeople[index], 
        role: typedRole,
        name: '',
        id: '' 
      };
    } else {
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    }
    
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student' as const, id: '', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  return {
    peopleInvolved,
    setPeopleInvolved,
    handlePersonChange,
    addPerson,
    removePerson
  };
}
