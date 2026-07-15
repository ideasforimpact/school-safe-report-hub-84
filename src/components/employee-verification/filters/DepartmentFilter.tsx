import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DepartmentOption } from './FilterBar';

interface DepartmentFilterProps {
  value: string;           // UUID or 'all'
  onChange: (value: string) => void;
  departments: DepartmentOption[];
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({ 
  value, 
  onChange, 
  departments 
}) => {
  const formatDepartmentLabel = (department: string) =>
    department ? department.charAt(0).toUpperCase() + department.slice(1) : department;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Departments" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Departments</SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {formatDepartmentLabel(dept.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DepartmentFilter;