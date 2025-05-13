
import React from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateChange: (field: string, value: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  dateFrom, 
  dateTo, 
  onDateChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm">From:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateChange('dateFrom', e.target.value)}
          className="w-auto"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm">To:</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateChange('dateTo', e.target.value)}
          className="w-auto"
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
