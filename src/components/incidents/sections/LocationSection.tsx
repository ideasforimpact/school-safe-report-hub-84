
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConfigItem {
  id: string;
  name: string;
}

interface LocationSectionProps {
  locationId: string;
  locations: ConfigItem[];
  facilityId: string;
  facilities: ConfigItem[];
  onSelectChange: (name: string, value: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  locations,
  facilityId,
  facilities,
  onSelectChange,
}) => {
  return (
    <>
      <div className="space-y-2 w-full">
        <label htmlFor="locationId" className="text-sm font-medium block text-left">
          Location
        </label>
        <Select 
          value={locationId} 
          onValueChange={(value) => onSelectChange('locationId', value)}
        >
          <SelectTrigger id="locationId" className="w-full">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 w-full">
        <label htmlFor="facilityId" className="text-sm font-medium block text-left">
          Facility
        </label>
        <Select 
          value={facilityId} 
          onValueChange={(value) => onSelectChange('facilityId', value)}
        >
          <SelectTrigger id="facilityId" className="w-full">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default LocationSection;
