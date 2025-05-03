
import React from 'react';
import { Input } from '@/components/ui/input';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  time,
  onChange,
}) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">
          Date of Occurrence <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          id="date"
          name="date"
          value={date}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium">
          Time of Occurrence <span className="text-red-500">*</span>
        </label>
        <Input
          type="time"
          id="time"
          name="time"
          value={time}
          onChange={onChange}
          required
        />
      </div>
    </>
  );
};

export default DateTimeSection;
