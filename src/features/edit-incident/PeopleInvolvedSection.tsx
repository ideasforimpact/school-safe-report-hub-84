
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentId: string;
}

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  setPeopleInvolved: React.Dispatch<React.SetStateAction<Person[]>>;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  setPeopleInvolved
}) => {
  const { employeeData } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({});
  const [clientType, setClientType] = useState<string>('');

  // Fetch client type information
  useEffect(() => {
    const fetchClientType = async () => {
      if (!employeeData?.clientId) return;

      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('client_type:client_type_id(key)')
          .eq('id', employeeData.clientId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching client type:', error);
          return;
        }

        if (clientData?.client_type) {
          setClientType(clientData.client_type.key);
        }
      } catch (error) {
        console.error('Error fetching client type:', error);
      }
    };

    fetchClientType();
  }, [employeeData?.clientId]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!employeeData?.clientId) return;

      try {
        setIsLoadingEmployees(true);
        const { data: employeesData, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email')
          .eq('client_id', employeeData.clientId)
          .eq('status', true);

        if (error) {
          console.error('Error fetching employees:', error);
          toast.error('Failed to load staff members');
          return;
        }

        const mappedEmployees = employeesData.map(emp => ({
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email
        }));

        setEmployees(mappedEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load staff members');
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [employeeData?.clientId]);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!employeeData?.clientId) return;

      try {
        setIsLoadingStudents(true);
        const { data: studentsData, error } = await supabase
          .from('students')
          .select('id, student_id, name, grade, section')
          .eq('client_id', employeeData.clientId);

        if (error) {
          console.error('Error fetching students:', error);
          toast.error('Failed to load students');
          return;
        }

        const mappedStudents = studentsData.map(student => ({
          id: student.id,
          name: student.name,
          grade: student.grade,
          section: student.section,
          studentId: student.student_id
        }));

        setStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [employeeData?.clientId]);

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    
    // If changing the role, clear the name field to start fresh
    if (field === 'role') {
      const typedRole = value as 'Student' | 'Staff' | 'Other';
      updatedPeople[index] = { 
        ...updatedPeople[index], 
        role: typedRole,
        name: '' 
      };
      // Clear search state for this index
      setSearchQueries(prev => ({ ...prev, [index]: '' }));
      setIsSearching(prev => ({ ...prev, [index]: false }));
    } else {
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    }
    
    setPeopleInvolved(updatedPeople);
  };

  const handleSearch = (index: number, query: string, role: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: query }));
    setIsSearching(prev => ({ ...prev, [index]: true }));
  };

  const handleSelectPerson = (index: number, person: Employee | Student, role: string) => {
    if (role === 'Staff') {
      const staff = person as Employee;
      handlePersonChange(index, 'name', `${staff.firstName} ${staff.lastName}`);
    } else {
      const student = person as Student;
      handlePersonChange(index, 'name', student.name);
    }
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const getFilteredOptions = (index: number, role: string) => {
    const searchQuery = searchQueries[index] || '';
    
    if (role === 'Staff') {
      return searchQuery
        ? employees.filter(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`;
            const searchTerm = searchQuery.toLowerCase();
            return fullName.toLowerCase().includes(searchTerm) || 
                   emp.email.toLowerCase().includes(searchTerm);
          })
        : employees;
    } else if (role === 'Student') {
      return searchQuery
        ? students.filter(student => {
            const searchTerm = searchQuery.toLowerCase();
            return student.name.toLowerCase().includes(searchTerm) ||
                   student.grade.toLowerCase().includes(searchTerm) ||
                   student.section.toLowerCase().includes(searchTerm) ||
                   student.studentId.toLowerCase().includes(searchTerm);
          })
        : students;
    }
    return [];
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student' as const, notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
    
    // Clean up search state
    setSearchQueries(prev => {
      const newQueries = { ...prev };
      delete newQueries[index];
      return newQueries;
    });
    setIsSearching(prev => {
      const newSearching = { ...prev };
      delete newSearching[index];
      return newSearching;
    });
  };

  const getStudentRoleLabel = () => {
    return clientType === 'school' ? 'Student' : 'Student';
  };

  const renderNameField = (person: Person, index: number) => {
    if (person.role === 'Staff' || person.role === 'Student') {
      const isCurrentlySearching = isSearching[index];
      const filteredOptions = getFilteredOptions(index, person.role);
      const isLoading = person.role === 'Staff' ? isLoadingEmployees : isLoadingStudents;

      return (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQueries[index] || (!isCurrentlySearching ? person.name : '')}
              onChange={(e) => handleSearch(index, e.target.value, person.role)}
              onFocus={() => setIsSearching(prev => ({ ...prev, [index]: true }))}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQueries[index]) {
                    setIsSearching(prev => ({ ...prev, [index]: false }));
                  }
                }, 200);
              }}
              placeholder={
                isLoading 
                  ? `Loading ${person.role.toLowerCase()}s...` 
                  : `Search by ${person.role.toLowerCase()} name...`
              }
              className="w-full pr-8"
              disabled={isLoading}
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {isCurrentlySearching && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              <ul className="py-1 text-sm">
                {filteredOptions.map((option) => (
                  <li
                    key={person.role === 'Staff' ? (option as Employee).id : (option as Student).id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectPerson(index, option, person.role)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div>
                      {person.role === 'Staff' ? (
                        <>
                          <span className="font-medium">
                            {(option as Employee).firstName} {(option as Employee).lastName}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({(option as Employee).email})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            {(option as Student).name}
                          </span>
                          <span className="text-gray-500 ml-1">
                            - {(option as Student).grade} {(option as Student).section} ({(option as Student).studentId})
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isCurrentlySearching && searchQueries[index] && filteredOptions.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <p className="p-3 text-sm text-gray-500">No {person.role.toLowerCase()}s found</p>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Input
          value={person.name}
          onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
          placeholder="Full name"
        />
      );
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role selection first */}
            <div className="space-y-2">
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
                <SelectContent className="bg-white z-50">
                  <SelectItem value="Student">{getStudentRoleLabel()}</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name field based on role */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              {renderNameField(person, index)}
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
        </div>
      ))}
    </div>
  );
};

export default PeopleInvolvedSection;
