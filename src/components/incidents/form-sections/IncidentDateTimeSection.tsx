
import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface IncidentDateTimeSectionProps {
  date: Date;
  time: string;
  onChange: (date: Date | undefined, timeString?: string) => void;
  errors: Record<string, string>;
}

const IncidentDateTimeSection: React.FC<IncidentDateTimeSectionProps> = ({
  date,
  time,
  onChange,
  errors,
}) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(date, e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium block">
          Date*
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                errors.date && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => onChange(selectedDate)}
              initialFocus
              disabled={(calendarDate) => calendarDate > new Date()}
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium block">
          Time*
        </label>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-gray-400" />
          <Input
            type="time"
            id="time"
            name="time"
            value={time}
            onChange={handleTimeChange}
            className={`${errors.time ? "border-red-500" : ""}`}
          />
        </div>
        {errors.time && (
          <p className="text-red-500 text-sm mt-1">{errors.time}</p>
        )}
      </div>
    </div>
  );
};

export default IncidentDateTimeSection;
