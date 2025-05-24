
import React, { useState, useEffect } from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const renderNameField = (person: Person, index: number) => {
    if (person.role === 'Staff') {
      return (
        <Select
          value={person.name}
          onValueChange={(value) => onPersonChange(index, 'name', value)}
          disabled={isLoadingStaff}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingStaff ? 'Loading staff...' : 'Select staff member'} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {staffMembers.map(staff => (
              <SelectItem key={staff.id} value={`${staff.firstName} ${staff.lastName}`}>
                {staff.firstName} {staff.lastName} - {staff.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else if (person.role === 'Student') {
      return (
        <Select
          value={person.name}
          onValueChange={(value) => onPersonChange(index, 'name', value)}
          disabled={isLoadingStudents}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingStudents ? 'Loading students...' : 'Select student'} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {filteredStudents.map(student => (
              <SelectItem key={student.id} value={student.name}>
                {student.name} - {student.grade} {student.section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else {
      return (
        <input
          type="text"
          value={person.name}
          onChange={(e) => onPersonChange(index, 'name', e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
          placeholder="Full name"
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
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={person.role}
                  onChange={(e) => onPersonChange(index, 'role', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white"
                >
                  <option value="">Select role</option>
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleInvolvedSection;
