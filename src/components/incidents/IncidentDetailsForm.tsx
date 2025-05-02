
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileItem } from '@/types/fileTypes';
import { IncidentType } from '@/types/incident';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

interface ConfigItem {
  id: string;
  name: string;
}

interface IncidentDetailsFormProps {
  formData: {
    type: string;
    categoryId: string;
    subcategory: string;
    description: string;
    rootCause: string;
    date: string;
    time: string;
    locationId: string;
    facilityId: string;
    status: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  categories: ConfigItem[];
  availableSubcategories: {id: string, name: string}[];
  locations: ConfigItem[];
  facilities: ConfigItem[];
}

const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onChange,
  onSelectChange,
  onDateTimeChange,
  supportingFiles,
  onFilesChange,
  categories,
  availableSubcategories,
  locations,
  facilities
}) => {
  // Calculate the current selected date from formData if available
  const selectedDate = formData.date ? new Date(formData.date) : undefined;
  
  // Function to handle time selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedDate) {
      onDateTimeChange(selectedDate, e.target.value);
    } else {
      onChange(e);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Report Type <span className="text-red-500">*</span>
        </label>
        <Select 
          onValueChange={(value) => onSelectChange('type', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Incident">Incident</SelectItem>
            <SelectItem value="Near Miss">Near Miss</SelectItem>
            <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.status}
          onValueChange={(value) => onSelectChange('status', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="priority" className="text-sm font-medium">
          Priority <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.priority}
          onValueChange={(value) => onSelectChange('priority', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          onValueChange={(value) => onSelectChange('categoryId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium">
          Subcategory <span className="text-red-500">*</span>
        </label>
        <Select 
          onValueChange={(value) => onSelectChange('subcategory', value)}
          required
          disabled={availableSubcategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map(subcategory => (
              <SelectItem key={subcategory.id} value={subcategory.name}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="locationId" className="text-sm font-medium">
          Where it Happened <span className="text-red-500">*</span>
        </label>
        <Select 
          onValueChange={(value) => onSelectChange('locationId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="facilityId" className="text-sm font-medium">
          School Facility <span className="text-red-500">*</span>
        </label>
        <Select 
          onValueChange={(value) => onSelectChange('facilityId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities.map(facility => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what happened in detail"
          value={formData.description}
          onChange={onChange}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">
          Supporting Documents (Optional)
        </label>
        <MultipleFilesUpload
          onFilesChange={onFilesChange}
          initialFiles={supportingFiles}
          maxFiles={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload up to 5 files (images, videos, documents) to support this incident report
        </p>
      </div>

      {/* Integrated Date and Time picker */}
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
                onSelect={(date) => onDateTimeChange(date, formData.time)}
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
              value={formData.time}
              onChange={handleTimeChange}
              required
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2 md:col-span-2 pt-4">
        <label htmlFor="rootCause" className="text-sm font-medium">
          Root Cause Analysis (Optional)
        </label>
        <Textarea
          id="rootCause"
          name="rootCause"
          placeholder="Describe the underlying factors that contributed to this incident"
          value={formData.rootCause}
          onChange={onChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default IncidentDetailsForm;
