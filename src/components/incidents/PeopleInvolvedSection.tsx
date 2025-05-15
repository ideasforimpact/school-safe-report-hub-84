
import React, { useState } from 'react';
import { Person } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Check, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Student } from '@/types/student';
import { Employee } from '@/contexts/employee/types';
import { cn } from '@/lib/utils';

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  onPersonChange: (index: number, field: keyof Person, value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  students?: Student[];
  employees?: Employee[];
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson,
  students = [],
  employees = []
}) => {
  const [searchInputs, setSearchInputs] = useState<{ [key: number]: string }>({});

  const handleStudentSearch = (index: number, search: string) => {
    setSearchInputs(prev => ({ ...prev, [index]: search }));
    // Allow manual entry even if not in dropdown
    onPersonChange(index, 'name', search);
  };

  const handleEmployeeSearch = (index: number, search: string) => {
    setSearchInputs(prev => ({ ...prev, [index]: search }));
    // Allow manual entry even if not in dropdown
    onPersonChange(index, 'name', search);
  };

  const handleSelectStudent = (index: number, student: Student) => {
    onPersonChange(index, 'name', student.name);
    setSearchInputs(prev => ({ ...prev, [index]: student.name }));
  };

  const handleSelectEmployee = (index: number, employee: Employee) => {
    onPersonChange(index, 'name', `${employee.firstName} ${employee.lastName}`);
    setSearchInputs(prev => ({ ...prev, [index]: `${employee.firstName} ${employee.lastName}` }));
  };

  // Filter students based on search input
  const getFilteredStudents = (index: number) => {
    const search = searchInputs[index]?.toLowerCase() || '';
    if (!search) return students;
    
    return students.filter(student => 
      student.name.toLowerCase().includes(search));
  };

  // Filter employees based on search input
  const getFilteredEmployees = (index: number) => {
    const search = searchInputs[index]?.toLowerCase() || '';
    if (!search) return employees;
    
    return employees.filter(employee => 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(search));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">People Involved</h3>
      </div>

      {peopleInvolved.map((person, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-gray-50">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Role <span className="text-red-500">*</span>
            </label>
            <Select 
              value={person.role}
              onValueChange={(value) => onPersonChange(index, 'role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Name <span className="text-red-500">*</span>
            </label>
            {person.role === 'Student' ? (
              <div className="relative w-full">
                <div className="relative">
                  <Input
                    value={searchInputs[index] || person.name}
                    onChange={(e) => handleStudentSearch(index, e.target.value)}
                    placeholder="Search for a student"
                    className="w-full pr-8"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {searchInputs[index] && getFilteredStudents(index).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <ul className="py-1 text-sm">
                      {getFilteredStudents(index).map((student) => (
                        <li 
                          key={student.id} 
                          onClick={() => handleSelectStudent(index, student)}
                          className={cn(
                            "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100",
                            person.name === student.name && "bg-gray-100"
                          )}
                        >
                          <div>
                            {student.name}
                            <span className="text-xs text-gray-500 ml-2">
                              ({student.grade || 'No Grade'})
                            </span>
                          </div>
                          {person.name === student.name && (
                            <Check className="h-4 w-4" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : person.role === 'Staff' ? (
              <div className="relative w-full">
                <div className="relative">
                  <Input
                    value={searchInputs[index] || person.name}
                    onChange={(e) => handleEmployeeSearch(index, e.target.value)}
                    placeholder="Search for staff member"
                    className="w-full pr-8"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {searchInputs[index] && getFilteredEmployees(index).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <ul className="py-1 text-sm">
                      {getFilteredEmployees(index).map((employee) => (
                        <li 
                          key={employee.id} 
                          onClick={() => handleSelectEmployee(index, employee)}
                          className={cn(
                            "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100",
                            person.name === `${employee.firstName} ${employee.lastName}` && "bg-gray-100"
                          )}
                        >
                          <div>
                            {employee.firstName} {employee.lastName}
                            <span className="text-xs text-gray-500 ml-2">
                              ({employee.department || 'No Department'})
                            </span>
                          </div>
                          {person.name === `${employee.firstName} ${employee.lastName}` && (
                            <Check className="h-4 w-4" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Input
                value={person.name}
                onChange={(e) => onPersonChange(index, 'name', e.target.value)}
                placeholder="Enter name"
              />
            )}
          </div>

          <div className="relative md:col-span-1">
            <label className="text-sm font-medium mb-1 block">
              Notes
            </label>
            <div className="flex">
              <Textarea
                value={person.notes || ''}
                onChange={(e) => onPersonChange(index, 'notes', e.target.value)}
                placeholder="Additional details"
                className="min-h-[80px] resize-none flex-grow"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-8 w-8 p-0 absolute top-8 right-0"
                onClick={() => onRemovePerson(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddPerson}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Person
      </Button>
    </div>
  );
};

export default PeopleInvolvedSection;
