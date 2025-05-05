
import React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onChange: (date: Date | undefined, timeString?: string) => void;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  time,
  onChange
}) => {
  const handleDateChange = (newDate: Date | undefined) => {
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(undefined, e.target.value);
  };

  const dateObj = date ? new Date(date) : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">
          Date <span className="text-red-500">*</span>
        </label>
        <DatePicker
          date={dateObj}
          onSelect={handleDateChange}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium">
          Time <span className="text-red-500">*</span>
        </label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={handleTimeChange}
          required
        />
      </div>
    </div>
  );
};

export default DateTimeSection;
