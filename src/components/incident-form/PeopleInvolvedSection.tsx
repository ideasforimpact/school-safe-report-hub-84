
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Search } from 'lucide-react';
import { Person } from '@/types/incident';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Student } from '@/types/student';

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
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({});

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

  // Fetch students when client type is school
  useEffect(() => {
    const fetchStudents = async () => {
      if (!employeeData?.clientId || clientType.toLowerCase() !== 'school') return;

      try {
        setIsLoadingStudents(true);
        const { data: studentData, error } = await supabase
          .from('students')
          .select('id, student_id, name, grade, section, campus')
          .eq('client_id', employeeData.clientId);

        if (error) {
          console.error('Error fetching students:', error);
          return;
        }

        const mappedStudents = studentData.map(student => ({
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          grade: student.grade,
          section: student.section,
          campus: student.campus,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        setStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [employeeData?.clientId, clientType]);

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    if (field === 'role' && value !== updatedPeople[index].role) {
      // Clear name when role changes and properly type the role value
      const roleValue = value as 'Student' | 'Staff' | 'Other';
      updatedPeople[index] = { ...updatedPeople[index], [field]: roleValue, name: '' };
    } else {
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    }
    setPeopleInvolved(updatedPeople);
  };

  const handleSearch = (index: number, value: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: value }));
    setIsSearching(prev => ({ ...prev, [index]: true }));
  };

  const handleSelectStudent = (index: number, student: Student) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { 
      ...updatedPeople[index], 
      name: `${student.name} (${student.studentId})` 
    };
    setPeopleInvolved(updatedPeople);
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const getFilteredStudents = (index: number) => {
    const searchQuery = searchQueries[index] || '';
    return searchQuery
      ? students.filter(student => {
          const searchTerm = searchQuery.toLowerCase();
          return student.name.toLowerCase().includes(searchTerm) ||
                 student.studentId.toLowerCase().includes(searchTerm) ||
                 student.grade.toLowerCase().includes(searchTerm) ||
                 student.section.toLowerCase().includes(searchTerm);
        })
      : students;
  };

  const addPerson = () => {
    const defaultRole = clientType.toLowerCase() === 'school' ? 'Student' as const : 'Staff' as const;
    setPeopleInvolved([...peopleInvolved, { name: '', role: defaultRole, notes: '' }]);
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

  const renderNameField = (person: Person, index: number) => {
    if (person.role === 'Student' && clientType.toLowerCase() === 'school') {
      const isCurrentlySearching = isSearching[index];
      const filteredStudents = getFilteredStudents(index);

      return (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQueries[index] || (isCurrentlySearching ? '' : person.name)}
              onChange={(e) => handleSearch(index, e.target.value)}
              onFocus={() => setIsSearching(prev => ({ ...prev, [index]: true }))}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQueries[index]) {
                    setIsSearching(prev => ({ ...prev, [index]: false }));
                  }
                }, 200);
              }}
              placeholder={isLoadingStudents ? "Loading students..." : "Search by student name or ID..."}
              className="w-full pr-8"
              disabled={isLoadingStudents}
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {isCurrentlySearching && filteredStudents.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              <ul className="py-1 text-sm">
                {filteredStudents.map((student) => (
                  <li
                    key={student.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectStudent(index, student)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div>
                      <span className="font-medium">{student.name}</span>
                      <span className="text-gray-500 ml-1">
                        ({student.studentId}) - {student.grade} {student.section}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isCurrentlySearching && searchQueries[index] && filteredStudents.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <p className="p-3 text-sm text-gray-500">No students found</p>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Input
          value={person.name}
          onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
          placeholder="Enter name"
        />
      );
    }
  };

  if (peopleInvolved.length === 0) {
    const defaultRole = clientType.toLowerCase() === 'school' ? 'Student' as const : 'Staff' as const;
    setPeopleInvolved([{ name: '', role: defaultRole, notes: '' }]);
  }

  return (
    <div className="space-y-4">
      {peopleInvolved.map((person, index) => {
        const roleOptions = getRoleOptions();
        
        return (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`person-role-${index}`}>Role</Label>
                <Select 
                  value={person.role} 
                  onValueChange={(value) => handlePersonChange(index, 'role', value)}
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
                <Label htmlFor={`person-name-${index}`}>Name</Label>
                {renderNameField(person, index)}
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
