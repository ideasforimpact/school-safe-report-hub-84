
import React, { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocationOptions } from '@/hooks/useLocationOptions';

interface LocationSectionProps {
  locationId: string;
  facilityId: string;
  onSelectChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange,
  errors = {},
}) => {
  const { locationOptions, facilityOptions, loading } = useLocationOptions(locationId);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Location</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label htmlFor="locationId" className="text-sm font-medium block">
            Campus/Location
            {errors.locationId && <span className="text-red-500">*</span>}
          </label>
          <Select 
            value={locationId}
            onValueChange={(value) => onSelectChange('locationId', value)}
            disabled={loading}
          >
            <SelectTrigger className={`${errors.locationId ? "border-red-500" : ""}`}>
              <SelectValue placeholder={loading ? "Loading..." : "Select location"} />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
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
            {errors.facilityId && <span className="text-red-500">*</span>}
          </label>
          <Select 
            value={facilityId}
            onValueChange={(value) => onSelectChange('facilityId', value)}
            disabled={loading || !locationId}
          >
            <SelectTrigger className={`${errors.facilityId ? "border-red-500" : ""}`}>
              <SelectValue placeholder={
                loading ? "Loading..." : 
                !locationId ? "Select a location first" : 
                "Select facility"
              } />
            </SelectTrigger>
            <SelectContent>
              {facilityOptions.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.facilityId && (
            <p className="text-red-500 text-sm mt-1">{errors.facilityId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
