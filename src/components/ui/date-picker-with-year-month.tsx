import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DatePickerWithYearMonthProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
  placeholderText?: string;
  minYear?: number;
  maxYear?: number;
}

export function DatePickerWithYearMonth({
  date,
  onChange,
  className,
  placeholderText = "Select date of birth",
  minYear = 1940,
  maxYear = new Date().getFullYear() - 18, // 18 years ago for driving license eligibility
}: DatePickerWithYearMonthProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(
    date?.getFullYear() || 1985
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    date?.getMonth() || 0
  );
  const [calendarDate, setCalendarDate] = React.useState<Date>(
    date || new Date(selectedYear, selectedMonth, 1)
  );

  // Generate year options
  const years = React.useMemo(() => {
    const yearOptions = [];
    for (let year = maxYear; year >= minYear; year--) {
      yearOptions.push(year);
    }
    return yearOptions;
  }, [minYear, maxYear]);

  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Update calendar date when year or month changes
  React.useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCalendarDate(newDate);
  }, [selectedYear, selectedMonth]);

  // Update selected year/month when date prop changes
  React.useEffect(() => {
    if (date) {
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setCalendarDate(date);
    }
  }, [date]);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    setSelectedYear(year);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    setSelectedMonth(month);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Update the year and month when a date is selected from calendar
      setSelectedYear(selectedDate.getFullYear());
      setSelectedMonth(selectedDate.getMonth());
      setCalendarDate(selectedDate);
    }
    onChange(selectedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholderText}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Year and Month Selectors */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Month" />
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={calendarDate}
            onMonthChange={setCalendarDate}
            disabled={(date) => {
              const year = date.getFullYear();
              return year < minYear || year > maxYear;
            }}
            initialFocus
            className={cn("p-0 pointer-events-auto")}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}