
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilities } from '@/contexts/FacilityContext';

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
  // Get facilities from context to supplement the facilities from config management
  const { facilities: contextFacilities } = useFacilities();

  // Create a merged list of facilities
  const allFacilities = [...facilities];
  
  // Add facilities from context if they don't already exist
  contextFacilities.forEach(facilityName => {
    const exists = facilities.some(f => f.name === facilityName);
    if (!exists) {
      allFacilities.push({
        id: `facility-${facilityName}`,
        name: facilityName
      });
    }
  });

  return (
    <>
      <div className="space-y-2">
        <label htmlFor="locationId" className="text-sm font-medium">
          Where it Happened <span className="text-red-500">*</span>
        </label>
        <Select 
          value={locationId}
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
          Incident <span className="text-red-500">*</span>
        </label>
        <Select 
          value={facilityId}
          onValueChange={(value) => onSelectChange('facilityId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select incident" />
          </SelectTrigger>
          <SelectContent>
            {allFacilities.map(facility => (
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
