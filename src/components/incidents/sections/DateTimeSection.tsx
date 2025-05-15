
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  errors?: Record<string, string>;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  time,
  onDateTimeChange,
  errors = {}
}) => {
  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateTimeChange(selectedDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateTimeChange(undefined, e.target.value);
  };

  const selectedDate = date ? new Date(date) : undefined;

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Date & Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
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
            name="time"
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
    </div>
  );
};

export default DateTimeSection;
