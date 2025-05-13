
import React from 'react';
import { ConfigItem } from '@/contexts/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncidentLocationSectionProps {
  locationId: string;
  facilityId: string;
  locations: ConfigItem[];
  facilities: ConfigItem[];
  onSelectChange: (name: string, value: string) => void;
  errors: Record<string, string>;
}

const IncidentLocationSection: React.FC<IncidentLocationSectionProps> = ({
  locationId,
  facilityId,
  locations,
  facilities,
  onSelectChange,
  errors
}) => {
  // Filter facilities based on selected location
  const filteredFacilities = facilities.filter(facility => {
    // In a real application, you would filter based on a location-facility relationship
    return true; // For now, show all facilities
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium block">
          Location*
        </label>
        <Select
          value={locationId}
          onValueChange={(value) => onSelectChange('locationId', value)}
        >
          <SelectTrigger className={errors.locationId ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.locationId && <p className="text-red-500 text-sm">{errors.locationId}</p>}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="facility" className="text-sm font-medium block">
          Facility
        </label>
        <Select
          value={facilityId}
          onValueChange={(value) => onSelectChange('facilityId', value)}
          disabled={!locationId || filteredFacilities.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={!locationId ? "Select a location first" : "Select a facility"} />
          </SelectTrigger>
          <SelectContent>
            {filteredFacilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default IncidentLocationSection;
