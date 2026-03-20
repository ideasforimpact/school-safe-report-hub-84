
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterActionsProps {
  onClearFilters: () => void;
  activeFilterCount: number;
}

const FilterActions: React.FC<FilterActionsProps> = ({ onClearFilters, activeFilterCount }) => {
  return (
    <Button variant="outline" onClick={onClearFilters} className="ml-auto">
      <X className="h-4 w-4" />
      Clear Filters ({activeFilterCount})
    </Button>
  );
};

export default FilterActions;
