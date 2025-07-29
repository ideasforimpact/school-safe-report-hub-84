import React, { useState, useEffect } from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormErrors } from '@/hooks/incident-form/useIncidentFormValidation';

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  onPersonChange: (index: number, field: string, value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  students: Student[];
  employees: UserBasicInfo[];
  errors?: FormErrors;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson,
  students,
  employees,
  errors = {}
}) => {
  const { employeeData } = useAuth();
  const [staffMembers, setStaffMembers] = useState<Employee[]>([]);
  const [fetchedStudents, setFetchedStudents] = useState<Student[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Get client type from auth context
  const clientType = employeeData?.client?.client_type?.key || employeeData?.clientType?.key || '';
  const isSchoolClient = clientType.toLowerCase() === 'school';
  
  console.log('Auth employeeData in incidents:', employeeData);
  console.log('Client type from auth:', clientType);
  console.log('Is school client:', isSchoolClient);
  
  // State for search functionality
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

        console.log('Fetched client data:', clientData);
      } catch (error) {
        console.error('Error fetching client type:', error);
      }
    };

    fetchClientType();
  }, [employeeData?.clientId]);

  // Fetch staff members when component mounts
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!employeeData?.clientId) return;

      try {
        setIsLoadingStaff(true);
        const { data: staffData, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email')
          .eq('client_id', employeeData.clientId)
          .eq('status', true);

        if (error) {
          console.error('Error fetching staff members:', error);
          toast.error('Failed to load staff members');
          return;
        }

        const mappedStaff = staffData.map(emp => ({
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email
        }));

        setStaffMembers(mappedStaff);
      } catch (error) {
        console.error('Error fetching staff members:', error);
        toast.error('Failed to load staff members');
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffMembers();
  }, [employeeData?.clientId]);

  // Fetch students filtered by client_id
  useEffect(() => {
    const fetchStudents = async () => {
      if (!employeeData?.clientId) return;

      try {
        setIsLoadingStudents(true);
        const { data: studentData, error } = await supabase
          .from('students')
          .select('id, student_id, name, grade, section, campus')
          .eq('client_id', employeeData.clientId);

        if (error) {
          console.error('Error fetching students:', error);
          toast.error('Failed to load students');
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

        setFetchedStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [employeeData?.clientId]);

  const handleSearch = (index: number, value: string, role: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: value }));
    setIsSearching(prev => ({ ...prev, [index]: true }));
  };

  const handleSelectPerson = (index: number, person: Employee | Student, role: string) => {
    if (role === 'Staff') {
      const staff = person as Employee;
      onPersonChange(index, 'name', `${staff.firstName} ${staff.lastName}`);
    } else {
      const student = person as Student;
      // For students, store the name with student ID for better identification
      onPersonChange(index, 'name', `${student.name} (${student.studentId})`);
    }
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const getFilteredOptions = (index: number, role: string) => {
    const searchQuery = searchQueries[index] || '';
    
    // Get already selected people names for filtering
    const selectedStaffNames = peopleInvolved
      .filter((person, idx) => idx !== index && person.role === 'Staff')
      .map(person => person.name);
    
    const selectedStudentNames = peopleInvolved
      .filter((person, idx) => idx !== index && person.role === 'Student')
      .map(person => {
        // Handle both formats: "John Doe" and "John Doe (STU123)"
        return person.name.includes('(') ? person.name.split(' (')[0] : person.name;
      });
    
    if (role === 'Staff') {
      const availableStaff = staffMembers.filter(staff => {
        const fullName = `${staff.firstName} ${staff.lastName}`;
        return !selectedStaffNames.includes(fullName);
      });
      
      return searchQuery
        ? availableStaff.filter(staff => {
            const fullName = `${staff.firstName} ${staff.lastName}`;
            const searchTerm = searchQuery.toLowerCase();
            return fullName.toLowerCase().includes(searchTerm) || 
                   staff.email.toLowerCase().includes(searchTerm);
          })
        : availableStaff;
    } else if (role === 'Student') {
      const availableStudents = fetchedStudents.filter(student => {
        return !selectedStudentNames.includes(student.name);
      });
      
      return searchQuery
        ? availableStudents.filter(student => {
            const searchTerm = searchQuery.toLowerCase();
            return student.name.toLowerCase().includes(searchTerm) ||
                   student.studentId.toLowerCase().includes(searchQuery) ||
                   student.grade.toLowerCase().includes(searchTerm) ||
                   student.section.toLowerCase().includes(searchTerm);
          })
        : availableStudents;
    }
    return [];
  };

  const getSelectedDisplay = (person: Person, role: string) => {
    if (role === 'Staff') {
      const staff = staffMembers.find(s => `${s.firstName} ${s.lastName}` === person.name);
      return staff ? `${staff.firstName} ${staff.lastName} (${staff.email})` : person.name;
    } else if (role === 'Student') {
      // If the name already includes student ID in parentheses, return as is
      if (person.name.includes('(') && person.name.includes(')')) {
        return person.name;
      }
      // Otherwise, try to find the student and add ID
      const student = fetchedStudents.find(s => s.name === person.name);
      return student ? `${student.name} (${student.studentId})` : person.name;
    }
    return person.name;
  };

  const renderNameField = (person: Person, index: number) => {
    const hasError = errors[`peopleInvolved.${index}.name`];
    
    if (person.role === 'Staff' || person.role === 'Student') {
      const isCurrentlySearching = isSearching[index];
      const filteredOptions = getFilteredOptions(index, person.role);
      const selectedDisplay = getSelectedDisplay(person, person.role);
      const isLoading = person.role === 'Staff' ? isLoadingStaff : isLoadingStudents;

      return (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQueries[index] || (isCurrentlySearching ? '' : selectedDisplay)}
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
                  ? `Loading ${person.role === 'Student' ? 'students' : person.role.toLowerCase()}s...` 
                  : `Search by ${person.role === 'Student' ? 'student name or ID' : person.role.toLowerCase() + ' name'}...`
              }
              className={`w-full pr-8 ${hasError ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {hasError && (
            <p className="text-red-500 text-xs mt-1">{hasError}</p>
          )}
          
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
                            ({(option as Student).studentId}) - {(option as Student).grade} {(option as Student).section}
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
        <div>
          <input
            type="text"
            value={person.name}
            onChange={(e) => onPersonChange(index, 'name', e.target.value)}
            className={`w-full p-2 border rounded-md text-sm ${hasError ? 'border-red-500' : ''}`}
            placeholder="Full name"
          />
          {hasError && (
            <p className="text-red-500 text-xs mt-1">{hasError}</p>
          )}
        </div>
      );
    }
  };

  // Helper function to get role options based on client type
  const getRoleOptions = () => {
    const options = [];
    
    // Only show Student option if client type is "school"
    if (isSchoolClient) {
      options.push({ value: 'Student', label: 'Student' });
    }
    
    // Always show Staff and Other options
    options.push(
      { value: 'Staff', label: 'Staff' },
      { value: 'Other', label: 'Other' }
    );
    
    return options;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">People Involved</h3>
        <button
          type="button"
          onClick={onAddPerson}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Person
        </button>
      </div>

      {peopleInvolved.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          No people added yet. Click "Add Person" to include individuals involved in this incident.
        </div>
      ) : (
        <div className="space-y-4">
          {peopleInvolved.map((person, index) => {
            const roleError = errors[`peopleInvolved.${index}.role`];
            const roleOptions = getRoleOptions();
            
            return (
              <div key={index} className="flex flex-col md:flex-row gap-3 p-3 border rounded-md bg-gray-50">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={person.role}
                    onChange={(e) => onPersonChange(index, 'role', e.target.value)}
                    className={`w-full p-2 border rounded-md text-sm bg-white ${roleError ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select role</option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {roleError && (
                    <p className="text-red-500 text-xs mt-1">{roleError}</p>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {renderNameField(person, index)}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={person.notes || ''}
                    onChange={(e) => onPersonChange(index, 'notes', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Additional notes"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => onRemovePerson(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                    aria-label="Remove person"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PeopleInvolvedSection;
