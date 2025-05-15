
import React from 'react';
import { Input } from '@/components/ui/input';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  time,
  onDateTimeChange
}) => {
  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value ? new Date(e.target.value) : undefined;
    onDateTimeChange(dateValue);
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateTimeChange(undefined, e.target.value);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="date" className="text-sm font-medium block text-left">
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          id="date"
          name="date"
          value={date}
          onChange={handleDateChange}
          className="w-full"
          required
        />
      </div>
      <div>
        <label htmlFor="time" className="text-sm font-medium block text-left">
          Time <span className="text-red-500">*</span>
        </label>
        <Input
          type="time"
          id="time"
          name="time"
          value={time}
          onChange={handleTimeChange}
          className="w-full"
          required
        />
      </div>
    </div>
  );
};

export default DateTimeSection;
