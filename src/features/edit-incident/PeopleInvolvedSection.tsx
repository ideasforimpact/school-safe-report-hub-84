
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Search } from 'lucide-react';
import { Person } from '@/types/incident';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: React.Dispatch<React.SetStateAction<Person[]>>;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  // State for search inputs
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});

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

  const handleSearch = (index: number, query: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: query }));
    // In a real application, this would trigger an API search based on role
    // For now, we'll just update the name field directly
    handlePersonChange(index, 'name', query);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student' as const, id: '', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  const getPlaceholderText = (role: string) => {
    switch(role) {
      case 'Student': return 'Search by student name or ID';
      case 'Staff': return 'Search by staff name or ID';
      default: return 'Search by name';
    }
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

          {/* Role selection first */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={person.role}
              onValueChange={(value) => {
                const typedRole = value as 'Student' | 'Staff' | 'Other';
                handlePersonChange(index, 'role', typedRole);
              }}
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

          {/* Search for person based on role */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Name</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  value={searchQueries[index] || person.name}
                  onChange={(e) => handleSearch(index, e.target.value)}
                  placeholder={getPlaceholderText(person.role)}
                  className="pr-8"
                />
                <Search className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* ID field - optional for students */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">
              {person.role === 'Student' ? 'Student ID (Optional)' : person.role === 'Staff' ? 'Staff ID' : 'ID'} 
              {person.role === 'Staff' && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={person.id || ''}
              onChange={(e) => handlePersonChange(index, 'id', e.target.value)}
              placeholder={`${person.role} ID`}
              required={person.role === 'Staff'}
            />
          </div>

          {/* Notes field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input
              value={person.notes || ''}
              onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
              placeholder="Additional details"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PeopleInvolvedSection;
