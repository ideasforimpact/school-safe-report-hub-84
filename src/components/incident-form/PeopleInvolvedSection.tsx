
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Person } from '@/types/incident';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: (people: Person[]) => void;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  const { employeeData } = useAuth();
  const [clientType, setClientType] = useState<string>('');

  // Fetch client type information
  useEffect(() => {
    const fetchClientType = async () => {
      if (!employeeData?.clientId) return;

      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('institution_type')
          .eq('id', employeeData.clientId)
          .single();

        if (error) {
          console.error('Error fetching client type:', error);
          return;
        }

        setClientType(clientData?.institution_type || '');
      } catch (error) {
        console.error('Error fetching client type:', error);
      }
    };

    fetchClientType();
  }, [employeeData?.clientId]);

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    const defaultRole = clientType.toLowerCase() === 'school' ? 'Student' : 'Staff';
    setPeopleInvolved([...peopleInvolved, { name: '', role: defaultRole as 'Student' | 'Staff', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeopleInvolved(updatedPeople);
  };

  // Helper function to get role options based on client type
  const getRoleOptions = () => {
    const options = [];
    
    // Only show Student option if client type is "school"
    if (clientType.toLowerCase() === 'school') {
      options.push({ value: 'Student', label: 'Student' });
    }
    
    // Always show Staff and Other options
    options.push(
      { value: 'Staff', label: 'Staff' },
      { value: 'Other', label: 'Other' }
    );
    
    return options;
  };

  if (peopleInvolved.length === 0) {
    const defaultRole = clientType.toLowerCase() === 'school' ? 'Student' : 'Staff';
    setPeopleInvolved([{ name: '', role: defaultRole as 'Student' | 'Staff', notes: '' }]);
  }

  return (
    <div className="space-y-4">
      {peopleInvolved.map((person, index) => {
        const roleOptions = getRoleOptions();
        
        return (
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
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
        );
      })}

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
