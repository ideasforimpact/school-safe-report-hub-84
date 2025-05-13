
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface DueDateSectionProps {
  dueDate: string;
  onChange: (value: string) => void;
}

const DueDateSection: React.FC<DueDateSectionProps> = ({ dueDate, onChange }) => {
  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="flex items-center mb-2">
        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
        <Label htmlFor="dueDate" className="text-lg font-medium">Due Date</Label>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Set the deadline for completing this assessment.
      </p>
      <Input 
        id="dueDate" 
        type="date" 
        value={dueDate}
        onChange={(e) => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="max-w-xs"
      />
    </div>
  );
};

export default DueDateSection;
