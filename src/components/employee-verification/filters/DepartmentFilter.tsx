import React from 'react';
import MultiSelectFilter from '@/components/common/MultiSelectFilter';
import type { DepartmentOption } from './FilterBar';

interface DepartmentFilterProps {
  value: string[];          // selected department UUIDs; empty = all
  onChange: (value: string[]) => void;
  departments: DepartmentOption[];
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  value,
  onChange,
  departments
}) => {
  const formatDepartmentLabel = (department: string) =>
    department ? department.charAt(0).toUpperCase() + department.slice(1) : department;

  const options = departments.map((dept) => ({
    value: dept.id,
    label: formatDepartmentLabel(dept.name),
  }));

  return (
    <MultiSelectFilter
      options={options}
      selected={value}
      onChange={onChange}
      placeholder="All Departments"
    />
  );
};

export default DepartmentFilter;
