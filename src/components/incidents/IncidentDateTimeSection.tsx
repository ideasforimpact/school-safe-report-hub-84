
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface IncidentDateTimeSectionProps {
  date: string;
  time: string;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  errors: Record<string, string>;
}

const IncidentDateTimeSection: React.FC<IncidentDateTimeSectionProps> = ({
  date,
  time,
  onDateTimeChange,
  errors
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium block">
          Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left",
                errors.date && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(new Date(date), 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              onSelect={(selectedDate) => onDateTimeChange(selectedDate, undefined)}
              disabled={(dateToCheck) => dateToCheck > new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium block">
          Time
        </label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onDateTimeChange(undefined, e.target.value)}
          className={errors.time ? "border-red-500" : ""}
        />
        {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
      </div>
    </div>
  );
};

export default IncidentDateTimeSection;
