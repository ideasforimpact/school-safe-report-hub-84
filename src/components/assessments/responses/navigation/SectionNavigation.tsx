
import React from 'react';
import { Button } from '@/components/ui/button';

interface SectionNavigationProps {
  currentSection: number;
  totalSections: number;
  onPrevious: () => void;
  onNext: () => void;
}

const SectionNavigation = ({
  currentSection,
  totalSections,
  onPrevious,
  onNext
}: SectionNavigationProps) => {
  const isFirstSection = currentSection === 0;
  const isLastSection = currentSection === totalSections - 1;
  
  if (totalSections <= 1) return null;
  
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">
        Section {currentSection + 1} of {totalSections}
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onPrevious}
          disabled={isFirstSection}
        >
          Previous
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onNext}
          disabled={isLastSection}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SectionNavigation;
