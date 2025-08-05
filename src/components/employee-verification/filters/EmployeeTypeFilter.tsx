import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const employeeTypes = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'intern', label: 'Intern' }
];

const EmployeeTypeFilter: React.FC<EmployeeTypeFilterProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {employeeTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmployeeTypeFilter;