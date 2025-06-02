
import React from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: React.Dispatch<React.SetStateAction<Person[]>>;
}

const EditPeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  const handlePersonChange = (index: number, field: string, value: string) => {
    const updatedPeople = [...peopleInvolved];
    
    if (field === 'role') {
      const typedRole = value as 'Student' | 'Staff' | 'Other';
      updatedPeople[index] = { 
        ...updatedPeople[index], 
        role: typedRole,
        name: '' 
      };
    } else {
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    }
    
    setPeopleInvolved(updatedPeople);
  };

  const handleAddPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student' as const, notes: '' }]);
  };

  const handleRemovePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  // Create empty arrays for students and employees - they will be fetched inside the component
  const students: Student[] = [];
  const employees: UserBasicInfo[] = [];

  return (
    <PeopleInvolvedSection
      peopleInvolved={peopleInvolved}
      onPersonChange={handlePersonChange}
      onAddPerson={handleAddPerson}
      onRemovePerson={handleRemovePerson}
      students={students}
      employees={employees}
    />
  );
};

export default EditPeopleInvolvedSection;
