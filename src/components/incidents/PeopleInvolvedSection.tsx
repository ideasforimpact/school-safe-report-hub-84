
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Users, Check, ChevronsUpDown } from 'lucide-react';
import { Person } from '@/types/incident';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { useStudents } from '@/contexts/StudentContext';
import { cn } from '@/lib/utils';

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
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [openPopover, setOpenPopover] = useState<Record<number, boolean>>({});
  
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
                  // Reset popover state
                  setOpenPopover({...openPopover, [index]: false});
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
                <Popover 
                  open={openPopover[index]} 
                  onOpenChange={(open) => setOpenPopover({...openPopover, [index]: open})}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPopover[index]}
                      className="w-full justify-between h-9"
                    >
                      {person.name
                        ? students.find((student) => student.name === person.name)?.name
                        : "Select student..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search students..." className="h-9" />
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={student.name}
                            onSelect={() => {
                              onPersonChange(index, 'name', student.name);
                              setOpenPopover({...openPopover, [index]: false});
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                person.name === student.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {student.name} ({student.studentId}) - {student.grade} {student.section}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : person.role === 'Staff' ? (
                <Popover 
                  open={openPopover[index]} 
                  onOpenChange={(open) => setOpenPopover({...openPopover, [index]: open})}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPopover[index]}
                      className="w-full justify-between h-9"
                      disabled={loadingEmployees}
                    >
                      {person.name
                        ? employees.find((employee) => employee.name === person.name)?.name
                        : loadingEmployees 
                          ? "Loading staff..." 
                          : "Select staff member..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff..." className="h-9" />
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.name}
                            onSelect={() => {
                              onPersonChange(index, 'name', employee.name);
                              setOpenPopover({...openPopover, [index]: false});
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                person.name === employee.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
