
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { Person } from '@/types/incident';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: React.Dispatch<React.SetStateAction<Person[]>>;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium">People Involved</h3>
        <Button type="button" variant="outline" size="sm" onClick={addPerson}>
          <Plus className="h-4 w-4 mr-2" /> Add Person
        </Button>
      </div>

      {peopleInvolved.map((person, index) => (
        <div key={index} className="border rounded-md p-4 mb-4 bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-medium text-sm">Person {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePerson(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={person.name}
                onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={person.role}
                onValueChange={(value) => handlePersonChange(index, 'role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {person.role === 'Student' ? 'Student ID' : person.role === 'Staff' ? 'Staff ID' : 'ID'} 
                {person.role !== 'Other' && <span className="text-red-500">*</span>}
              </label>
              <Input
                value={person.id || ''}
                onChange={(e) => handlePersonChange(index, 'id', e.target.value)}
                placeholder={`${person.role} ID`}
                required={person.role !== 'Other'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={person.notes || ''}
                onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
                placeholder="Additional details"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PeopleInvolvedSection;
