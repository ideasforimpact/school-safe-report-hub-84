
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
  // Calculate the current selected date from formData if available
  const selectedDate = date ? new Date(date) : undefined;
  
  // Function to handle time selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedDate) {
      onDateTimeChange(selectedDate, e.target.value);
    }
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-medium">
        Date and Time of Occurrence <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => onDateTimeChange(date, time)}
              initialFocus
              disabled={(date) => date > new Date()}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            id="time"
            name="time"
            value={time}
            onChange={handleTimeChange}
            required
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};

export default DateTimeSection;
