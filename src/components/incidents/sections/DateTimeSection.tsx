
import React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  time,
  onDateTimeChange,
}) => {
  const handleDateChange = (newDate: Date | undefined) => {
    onDateTimeChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateTimeChange(undefined, e.target.value);
  };

  const dateObj = date ? new Date(date) : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <label htmlFor="date" className="text-sm font-medium text-left block">
          Date <span className="text-red-500">*</span>
        </label>
        <DatePicker
          date={dateObj}
          onChange={handleDateChange}
        />
      </div>

      <div className="space-y-2 text-left">
        <label htmlFor="time" className="text-sm font-medium text-left block">
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
