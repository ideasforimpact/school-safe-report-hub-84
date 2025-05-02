
import { useState } from 'react';
import { Person } from '@/types/incident';

export function usePeopleInvolved() {
  // People involved state
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student' as const, id: '', notes: '' }
  ]);

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', id: '', notes: '' }]);
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
