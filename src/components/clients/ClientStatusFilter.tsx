
import React from 'react';
import { Button } from '@/components/ui/button';

export type StatusFilter = 'active' | 'inactive' | 'all';

interface ClientStatusFilterProps {
  currentFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const ClientStatusFilter = ({ currentFilter, onFilterChange }: ClientStatusFilterProps) => {
  return (
    <div className="flex gap-2 mb-4">
      <span className="text-sm font-medium text-gray-700 flex items-center mr-2">
        Filter by Status:
      </span>
      <Button
        variant={currentFilter === 'active' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('active')}
      >
        Active
      </Button>
      <Button
        variant={currentFilter === 'inactive' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('inactive')}
      >
        Inactive
      </Button>
      <Button
        variant={currentFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
      >
        All
      </Button>
    </div>
  );
};

export default ClientStatusFilter;
