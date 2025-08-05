import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SearchFilter from '@/components/incidents/filters/SearchFilter';
import StatusFilter from './StatusFilter';
import DocumentStatusFilter from './DocumentStatusFilter';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  documentStatusFilter: string;
  onDocumentStatusChange: (value: string) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  documentStatusFilter,
  onDocumentStatusChange,
  onClearFilters,
  resultCount,
  totalCount
}) => {
  const hasActiveFilters = searchTerm || 
    statusFilter !== 'all' || 
    documentStatusFilter !== 'all';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <SearchFilter
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, email, or employee ID..."
          />
        </div>
        
        <StatusFilter
          value={statusFilter}
          onChange={onStatusChange}
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