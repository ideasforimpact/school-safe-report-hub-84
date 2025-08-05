import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatusRadioFilter from './StatusRadioFilter';
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
    <div className="space-y-6 mb-6">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or employee ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 w-full text-base"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-6">
          <DocumentStatusFilter
            value={documentStatusFilter}
            onChange={onDocumentStatusChange}
          />
          
          <StatusRadioFilter
            value={statusFilter}
            onChange={onStatusChange}
          />
        </div>
        
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