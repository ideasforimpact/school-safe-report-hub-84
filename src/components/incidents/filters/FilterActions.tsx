
import React from 'react';
import { Button } from '@/components/ui/button';

interface FilterActionsProps {
  onClearFilters: () => void;
}

const FilterActions: React.FC<FilterActionsProps> = ({ onClearFilters }) => {
  return (
    <Button variant="outline" onClick={onClearFilters} className="ml-auto">
      Clear Filters
    </Button>
  );
};

export default FilterActions;
