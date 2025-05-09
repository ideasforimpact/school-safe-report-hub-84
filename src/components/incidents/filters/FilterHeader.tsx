
import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterHeaderProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeFilterCount: number;
  title?: string;
}

const FilterHeader: React.FC<FilterHeaderProps> = ({ 
  isOpen, 
  setIsOpen, 
  activeFilterCount,
  title = "Filters"
}) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex items-center">
        <h2 className="font-semibold text-lg">{title}</h2>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount} active
          </Badge>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Filter className="h-4 w-4 mr-1" />
        {isOpen ? 'Hide Filters' : 'Show Filters'}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default FilterHeader;
