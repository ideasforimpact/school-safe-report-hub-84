import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import DocumentStatusFilter from './DocumentStatusFilter';
import EmployeeDocumentTypeFilter from './EmployeeDocumentTypeFilter';
import DepartmentFilter from './DepartmentFilter';
import { fetchEmployeeDepartmentsShared } from '@/services/employee/employeeReferenceDataShared';
import { toast } from 'sonner';

export interface DepartmentOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  documentStatusFilter: string[];
  onDocumentStatusChange: (value: string[]) => void;
  onClearFilters: () => void;
  documentTypeFilter: string[];
  onDocumentTypeChange: (value: string[]) => void;
  departmentFilter: string[];   // UUIDs, empty = all
  onDepartmentChange: (value: string[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  documentStatusFilter,
  onDocumentStatusChange,
  onClearFilters,
  documentTypeFilter,
  onDocumentTypeChange,
  departmentFilter,
  onDepartmentChange,
}) => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await fetchEmployeeDepartmentsShared();
      setDepartments(data.map(d => ({ id: d.id, name: d.department_name || '' })));
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const activeFilterCount =
    (searchTerm.trim() !== '' ? 1 : 0) +
    documentStatusFilter.length +
    documentTypeFilter.length +
    departmentFilter.length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-[400px]">
          <DebouncedSearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, email, employee ID"
            triggerOnEnter
          />
        </div>

        <EmployeeDocumentTypeFilter
          value={documentTypeFilter}
          onChange={onDocumentTypeChange}
        />
        <DepartmentFilter
          value={departmentFilter}
          onChange={onDepartmentChange}
          departments={departments}
        />
        <DocumentStatusFilter
          value={documentStatusFilter}
          onChange={onDocumentStatusChange}
        />

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;