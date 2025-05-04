
import React from 'react';
import { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker";

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
}

const DateRangeFilter = ({ dateRange, setDateRange }: DateRangeFilterProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        <CalendarRange className="h-4 w-4 inline mr-1" />
        Date Range
      </label>
      <DatePickerWithRange
        date={dateRange}
        onChange={setDateRange}
      />
    </div>
  );
};

export default DateRangeFilter;
