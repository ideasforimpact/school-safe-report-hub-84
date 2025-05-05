
import React, { useState } from 'react';
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
  const dateObj = date ? new Date(date) : undefined;
  
  // Local state to manage the time input within the calendar popover
  const [localTime, setLocalTime] = useState(time);
  
  // Function to handle time selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setLocalTime(newTime);
    
    // If we have a date, update both date and time
    if (dateObj) {
      onChange(dateObj, newTime);
    }
  };
  
  // Function to handle date selection along with the current time
  const handleDateSelect = (date: Date | undefined) => {
    onChange(date, localTime);
  };
  
  // Format the datetime for display
  const formattedDateTime = dateObj 
    ? `${format(dateObj, "PPP")} at ${time}`
    : "Select date and time";

  return (
    <div className="space-y-2">
      <label htmlFor="datetime" className="text-sm font-medium">
        Date and Time
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateObj && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDateTime}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={dateObj}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date > new Date()}
              className="pointer-events-auto"
            />
            
            <div className="px-3 pb-3 pt-2 border-t mt-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-3">Time:</span>
                <Input
                  type="time"
                  value={localTime}
                  onChange={handleTimeChange}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateTimeSection;
