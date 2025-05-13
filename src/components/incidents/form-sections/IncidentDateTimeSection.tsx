
import React from 'react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncidentDateTimeSectionProps {
  date: Date;
  time: string;
  onChange: (date?: Date, time?: string) => void;
  errors: Record<string, string>;
}

const IncidentDateTimeSection: React.FC<IncidentDateTimeSectionProps> = ({
  date,
  time,
  onChange,
  errors,
}) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(undefined, e.target.value);
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium block">
          Date <span className="text-red-500">*</span>
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                errors.date ? "border-red-500" : "",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => onChange(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium block">
          Time <span className="text-red-500">*</span>
        </label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={handleTimeChange}
          className={errors.time ? "border-red-500" : ""}
        />
        {errors.time && (
          <p className="text-red-500 text-sm mt-1">{errors.time}</p>
        )}
      </div>
    </div>
  );
};

export default IncidentDateTimeSection;
