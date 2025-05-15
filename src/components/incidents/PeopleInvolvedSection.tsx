
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
import { Plus, X, Users } from 'lucide-react';
import { Person } from '@/types/incident';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { useStudents } from '@/contexts/StudentContext';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  onPersonChange: (index: number, field: keyof Person, value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson
}) => {
  const [employees, setEmployees] = useState<Array<{ id: string, name: string }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { students } = useStudents();
  
  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const fetchedEmployees = await getAllEmployeesFromApi();
        const formattedEmployees = fetchedEmployees.map(employee => ({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`
        }));
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);
  
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary-600" />
          <h3 className="text-md font-medium">People Involved</h3>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAddPerson}
          className="text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Person
        </Button>
      </div>

      {peopleInvolved.map((person, index) => (
        <div 
          key={index} 
          className="mb-3 border-b pb-3 last:border-b-0 last:pb-0"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Person {index + 1}</span>
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemovePerson(index)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Role selection */}
            <div>
              <Select
                value={person.role}
                onValueChange={(value) => {
                  const typedRole = value as 'Student' | 'Staff' | 'Other';
                  onPersonChange(index, 'role', typedRole);
                  // Clear name when role changes
                  onPersonChange(index, 'name', '');
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name input/selection based on role */}
            <div>
              {person.role === 'Student' ? (
                <Select
                  value={person.name}
                  onValueChange={(value) => onPersonChange(index, 'name', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={students.length > 0 ? "Select student" : "Loading students..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.name}>
                        {student.name} ({student.studentId})
                      </SelectItem>
                    ))}
                    {students.length === 0 && (
                      <SelectItem value="no-students" disabled>
                        No students available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : person.role === 'Staff' ? (
                <Select
                  value={person.name}
                  onValueChange={(value) => onPersonChange(index, 'name', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={loadingEmployees ? "Loading staff..." : "Select staff"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.name}>
                        {employee.name}
                      </SelectItem>
                    ))}
                    {employees.length === 0 && !loadingEmployees && (
                      <SelectItem value="no-employees" disabled>
                        No staff members available
                      </SelectItem>
                    )}
                    {loadingEmployees && (
                      <SelectItem value="loading" disabled>
                        Loading staff...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={person.name}
                  onChange={(e) => onPersonChange(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="h-9"
                />
              )}
            </div>

            {/* Notes field - full width */}
            <div className="md:col-span-2">
              <Input
                value={person.notes || ''}
                onChange={(e) => onPersonChange(index, 'notes', e.target.value)}
                placeholder="Additional notes (optional)"
                className="h-9"
              />
            </div>
          </div>
        </div>
      ))}
      
      {peopleInvolved.length === 0 && (
        <div className="text-center p-4 border border-dashed rounded-md text-gray-500">
          No people added yet
        </div>
      )}
    </div>
  );
};

export default PeopleInvolvedSection;
