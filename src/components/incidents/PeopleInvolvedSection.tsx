
import React, { useState, useEffect } from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson,
  students,
  employees,
}) => {
  const { employeeData } = useAuth();
  const [staffMembers, setStaffMembers] = useState<Employee[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({});

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

  const handleSearch = (index: number, query: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: query }));
    setIsSearching(prev => ({ ...prev, [index]: true }));
  };

  const handleSelectPerson = (index: number, personId: string, displayName: string) => {
    onPersonChange(index, 'name', personId);
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const getFilteredOptions = (person: Person, index: number) => {
    const query = searchQueries[index] || '';
    
    if (person.role === 'staff') {
      return query
        ? staffMembers.filter(staff => {
            const fullName = `${staff.firstName} ${staff.lastName}`;
            const searchTerm = query.toLowerCase();
            return fullName.toLowerCase().includes(searchTerm) || 
                   staff.email.toLowerCase().includes(searchTerm);
          })
        : staffMembers;
    } else if (person.role === 'student') {
      return query
        ? students.filter(student => {
            const searchTerm = query.toLowerCase();
            return student.name.toLowerCase().includes(searchTerm) || 
                   student.studentId.toLowerCase().includes(searchTerm);
          })
        : students;
    }
    
    return [];
  };

  const getSelectedPersonDisplay = (person: Person) => {
    if (person.role === 'staff') {
      const selectedStaff = staffMembers.find(staff => staff.id === person.name);
      return selectedStaff 
        ? `${selectedStaff.firstName} ${selectedStaff.lastName} (${selectedStaff.email})` 
        : '';
    } else if (person.role === 'student') {
      const selectedStudent = students.find(student => student.id === person.name);
      return selectedStudent 
        ? `${selectedStudent.name} (${selectedStudent.studentId})` 
        : '';
    }
    return person.name;
  };

  const renderNameField = (person: Person, index: number) => {
    if (person.role === 'staff' || person.role === 'student') {
      const isCurrentlySearching = isSearching[index];
      const filteredOptions = getFilteredOptions(person, index);
      const selectedDisplay = getSelectedPersonDisplay(person);

      return (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQueries[index] || (isCurrentlySearching ? '' : selectedDisplay)}
              onChange={(e) => handleSearch(index, e.target.value)}
              onFocus={() => setIsSearching(prev => ({ ...prev, [index]: true }))}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQueries[index]) {
                    setIsSearching(prev => ({ ...prev, [index]: false }));
                  }
                }, 200);
              }}
              placeholder={
                isLoadingStaff 
                  ? "Loading..." 
                  : person.role === 'staff' 
                    ? "Search by name or email..." 
                    : "Search by name or student ID..."
              }
              className="w-full pr-8"
              disabled={isLoadingStaff}
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {isCurrentlySearching && filteredOptions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              <ul className="py-1 text-sm">
                {filteredOptions.map((option) => (
                  <li
                    key={option.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      if (person.role === 'staff') {
                        const staff = option as Employee;
                        handleSelectPerson(index, staff.id, `${staff.firstName} ${staff.lastName}`);
                      } else {
                        const student = option as Student;
                        handleSelectPerson(index, student.id, student.name);
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div>
                      <span className="font-medium">
                        {person.role === 'staff' 
                          ? `${(option as Employee).firstName} ${(option as Employee).lastName}`
                          : (option as Student).name
                        }
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({person.role === 'staff' 
                          ? (option as Employee).email
                          : (option as Student).studentId
                        })
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isCurrentlySearching && searchQueries[index] && filteredOptions.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
              <p className="p-3 text-sm text-gray-500">
                No {person.role === 'staff' ? 'staff members' : 'students'} found
              </p>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <input
          type="text"
          value={person.name}
          onChange={(e) => onPersonChange(index, 'name', e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
          placeholder="Enter name"
        />
      );
    }
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
          {peopleInvolved.map((person, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 p-3 border rounded-md bg-gray-50">
              {/* Role Field - Now First */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={person.role}
                  onChange={(e) => onPersonChange(index, 'role', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                  <option value="contractor">Contractor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {/* Name Field - Now Second */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                {renderNameField(person, index)}
              </div>
              
              {/* Notes Field - Changed from Type dropdown to text input */}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleInvolvedSection;
