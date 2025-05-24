
import React, { useState, useEffect } from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';

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
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});

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

        setFilteredStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [employeeData?.clientId]);

  // Filter options based on search query
  const getFilteredOptions = (person: Person, index: number) => {
    const query = searchQueries[index]?.toLowerCase() || '';
    
    if (person.role === 'Staff') {
      return staffMembers.filter(staff => 
        staff.firstName.toLowerCase().includes(query) ||
        staff.lastName.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query)
      );
    } else if (person.role === 'Student') {
      return filteredStudents.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query)
      );
    }
    return [];
  };

  const handleSearchChange = (index: number, query: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: query }));
  };

  const handleOptionSelect = (index: number, optionId: string, person: Person) => {
    onPersonChange(index, 'name', optionId);
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const getDisplayName = (person: Person) => {
    if (person.role === 'Staff') {
      const staff = staffMembers.find(s => s.id === person.name);
      return staff ? `${staff.firstName} ${staff.lastName}` : '';
    } else if (person.role === 'Student') {
      const student = filteredStudents.find(s => s.id === person.name);
      return student ? student.name : '';
    }
    return person.name;
  };

  const renderNameField = (person: Person, index: number) => {
    if (person.role === 'Staff') {
      const filteredOptions = getFilteredOptions(person, index);
      const isSearching = searchQueries[index] && searchQueries[index].length > 0;
      
      return (
        <div className="relative">
          <input
            type="text"
            value={searchQueries[index] || getDisplayName(person)}
            onChange={(e) => handleSearchChange(index, e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            placeholder={isLoadingStaff ? 'Loading staff...' : 'Search staff by name or email'}
            disabled={isLoadingStaff}
          />
          
          {isSearching && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredOptions.map((staff) => (
                <div
                  key={staff.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleOptionSelect(index, staff.id, person)}
                >
                  <div className="font-medium text-sm">{staff.firstName} {staff.lastName}</div>
                  <div className="text-xs text-gray-500">{staff.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (person.role === 'Student') {
      const filteredOptions = getFilteredOptions(person, index);
      const isSearching = searchQueries[index] && searchQueries[index].length > 0;
      
      return (
        <div className="relative">
          <input
            type="text"
            value={searchQueries[index] || getDisplayName(person)}
            onChange={(e) => handleSearchChange(index, e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            placeholder={isLoadingStudents ? 'Loading students...' : 'Search student by name or ID'}
            disabled={isLoadingStudents}
          />
          
          {isSearching && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredOptions.map((student) => (
                <div
                  key={student.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleOptionSelect(index, student.id, person)}
                >
                  <div className="font-medium text-sm">{student.name}</div>
                  <div className="text-xs text-gray-500">ID: {student.studentId}</div>
                </div>
              ))}
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
                  onChange={(e) => {
                    onPersonChange(index, 'role', e.target.value);
                    onPersonChange(index, 'name', ''); // Clear name when role changes
                    setSearchQueries(prev => ({ ...prev, [index]: '' })); // Clear search
                  }}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select role</option>
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
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
