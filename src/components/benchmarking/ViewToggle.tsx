
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, BarChart2 } from 'lucide-react';

interface ViewToggleProps {
  showSubcategories: boolean;
  setShowSubcategories: (show: boolean) => void;
}

const ViewToggle = ({ showSubcategories, setShowSubcategories }: ViewToggleProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={showSubcategories ? "default" : "outline"} 
        size="sm" 
        onClick={() => setShowSubcategories(true)}
      >
        <ChevronRight className="h-4 w-4 mr-1" />
        Subcategories
      </Button>
      <Button 
        variant={!showSubcategories ? "default" : "outline"} 
        size="sm" 
        onClick={() => setShowSubcategories(false)}
      >
        <BarChart2 className="h-4 w-4 mr-1" />
        Summary
      </Button>
    </div>
  );
};

export default ViewToggle;
