
import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList } from 'lucide-react';

interface ViewToggleProps {
  viewType: 'table' | 'card';
  onViewChange: (viewType: 'table' | 'card') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewType, onViewChange }) => {
  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200">
      <Button
        variant={viewType === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="rounded-r-none"
      >
        <LayoutList className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant={viewType === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('card')}
        className="rounded-l-none"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Cards
      </Button>
    </div>
  );
};

export default ViewToggle;
