
import React, { useState } from 'react';
import { Person } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Student } from '@/types/student';
import { Employee } from '@/contexts/employee/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
  const [open, setOpen] = useState<{ [key: number]: boolean }>({});

  const handleSelectStudent = (index: number, student: Student) => {
    onPersonChange(index, 'name', `${student.firstName} ${student.lastName}`);
    setOpen({ ...open, [index]: false });
  };

  const handleSelectEmployee = (index: number, employee: Employee) => {
    onPersonChange(index, 'name', `${employee.firstName} ${employee.lastName}`);
    setOpen({ ...open, [index]: false });
  };

  const toggleOpen = (index: number) => {
    setOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
              <Popover open={open[index]} onOpenChange={() => toggleOpen(index)}>
                <PopoverTrigger asChild>
                  <div className="relative w-full">
                    <Input
                      value={person.name}
                      onChange={(e) => onPersonChange(index, 'name', e.target.value)}
                      placeholder="Search and select a student"
                      onClick={() => setOpen({ ...open, [index]: true })}
                      className="w-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandEmpty>No students found.</CommandEmpty>
                    <ScrollArea className="max-h-52">
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            onSelect={() => handleSelectStudent(index, student)}
                            className="flex items-center justify-between"
                          >
                            <div>
                              {student.firstName} {student.lastName}
                              <span className="text-xs text-gray-500 ml-2">
                                ({student.grade || 'No Grade'})
                              </span>
                            </div>
                            {person.name === `${student.firstName} ${student.lastName}` && (
                              <Check className="h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : person.role === 'Staff' ? (
              <Popover open={open[index]} onOpenChange={() => toggleOpen(index)}>
                <PopoverTrigger asChild>
                  <div className="relative w-full">
                    <Input
                      value={person.name}
                      onChange={(e) => onPersonChange(index, 'name', e.target.value)}
                      placeholder="Search and select staff member"
                      onClick={() => setOpen({ ...open, [index]: true })}
                      className="w-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandEmpty>No staff members found.</CommandEmpty>
                    <ScrollArea className="max-h-52">
                      <CommandGroup>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            onSelect={() => handleSelectEmployee(index, employee)}
                            className="flex items-center justify-between"
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
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
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
