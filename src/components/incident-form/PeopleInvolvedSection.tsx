
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Person } from '@/types/incident';
import { useAuth } from '@/contexts/auth/useAuth';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: (people: Person[]) => void;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  const { user, employeeData } = useAuth();
  
  // Get organization name dynamically
  const getOrganizationName = () => {
    // First check employeeData
    if (employeeData?.clientType?.name) {
      return employeeData.clientType.name;
    }
    
    // Then check user.clientType
    if (user?.clientType?.name) {
      return user.clientType.name;
    }
    
    // Then check user.client.client_type.name
    if (user?.client?.client_type?.name) {
      return user.client.client_type.name;
    }
    
    return 'Student'; // Fallback to Student if no organization type found
  };

  const organizationName = getOrganizationName();

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeopleInvolved(updatedPeople);
  };

  if (peopleInvolved.length === 0) {
    setPeopleInvolved([{ name: '', role: 'Student', notes: '' }]);
  }

  return (
    <div className="space-y-4">
      {peopleInvolved.map((person, index) => (
        <div key={index} className="p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`person-name-${index}`}>Name</Label>
              <Input
                id={`person-name-${index}`}
                value={person.name}
                onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`person-role-${index}`}>Role</Label>
              <Select 
                value={person.role} 
                onValueChange={(value) => handlePersonChange(index, 'role', value as 'Student' | 'Staff' | 'Other')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">{organizationName}</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`person-notes-${index}`}>Notes</Label>
              <div className="flex gap-2">
                <Input
                  id={`person-notes-${index}`}
                  value={person.notes || ''}
                  onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
                  placeholder="Optional notes"
                />
                {peopleInvolved.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePerson(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addPerson}
        className="w-full flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Person
      </Button>
    </div>
  );
};

export default PeopleInvolvedSection;
