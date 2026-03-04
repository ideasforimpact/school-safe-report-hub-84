import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SearchFilter from '@/components/incidents/filters/SearchFilter';
import DocumentStatusFilter from './DocumentStatusFilter';
import EmployeeDocumentTypeFilter from './EmployeeDocumentTypeFilter';
import DepartmentFilter from './DepartmentFilter';


interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  documentStatusFilter: string;
  onDocumentStatusChange: (value: string) => void;
  onClearFilters: () => void;
  documentTypeFilter: string;
  onDocumentTypeChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  resultCount: number;
  totalCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  documentStatusFilter,
  onDocumentStatusChange,
  onClearFilters,
  resultCount,
  documentTypeFilter,
  onDocumentTypeChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  totalCount
}) => {
 const hasActiveFilters =
    searchTerm ||
    documentStatusFilter !== 'all' ||
    documentTypeFilter !== 'all' || departmentFilter !== 'all';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-[400px]">
          <SearchFilter
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, email, employee ID"
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
            Clear Filters
          </Button>
        )}
      </div>
      
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {resultCount} of {totalCount} employees
        </span>
        {hasActiveFilters && (
          <span className="text-primary">Filters applied</span>
        )}
      </div>
    </div>
  );
};

export default FilterBar;