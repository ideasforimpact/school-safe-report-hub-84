
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface LocationOption {
  value: string;
  label: string;
}

interface IncidentLocationSectionProps {
  locationId: string;
  location: string;
  facilityId: string;
  locationOptions: LocationOption[];
  facilityOptions: LocationOption[];
  onLocationIdChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onFacilityChange: (value: string) => void;
  errors: Record<string, string>;
}

const IncidentLocationSection: React.FC<IncidentLocationSectionProps> = ({
  locationId,
  location,
  facilityId,
  locationOptions,
  facilityOptions,
  onLocationIdChange,
  onLocationChange,
  onFacilityChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="locationId" className="text-sm font-medium block">
            Location <span className="text-red-500">*</span>
          </label>
          <Select 
            value={locationId}
            onValueChange={onLocationIdChange}
          >
            <SelectTrigger className={errors.locationId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.locationId && (
            <p className="text-red-500 text-sm mt-1">{errors.locationId}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="facilityId" className="text-sm font-medium block">
            Facility
          </label>
          <Select 
            value={facilityId}
            onValueChange={onFacilityChange}
            disabled={!locationId || facilityOptions.length === 0}
          >
            <SelectTrigger className={errors.facilityId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.facilityId && (
            <p className="text-red-500 text-sm mt-1">{errors.facilityId}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium block">
          Specific Location Details
        </label>
        <Input
          id="location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Provide specific details about the location"
        />
      </div>
    </div>
  );
};

export default IncidentLocationSection;
