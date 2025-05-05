
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfigItem } from '@/contexts/types';

interface LocationFacilitySectionProps {
  location: string;
  locations: ConfigItem[];
  facility: string;
  facilities: ConfigItem[];
  onSelectChange: (name: string, value: string) => void;
}

const LocationFacilitySection: React.FC<LocationFacilitySectionProps> = ({
  location,
  locations,
  facility,
  facilities,
  onSelectChange,
}) => {
  // Filter facilities based on selected location
  const availableFacilities = facilities;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="locationId" className="text-sm font-medium">
          Location <span className="text-red-500">*</span>
        </label>
        <Select
          value={location}
          onValueChange={(value) => onSelectChange('locationId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="facilityId" className="text-sm font-medium">
          Facility <span className="text-red-500">*</span>
        </label>
        <Select
          value={facility}
          onValueChange={(value) => onSelectChange('facilityId', value)}
          required
          disabled={!location}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {availableFacilities.map((fac) => (
              <SelectItem key={fac.id} value={fac.id}>
                {fac.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationFacilitySection;
