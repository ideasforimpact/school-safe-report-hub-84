
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfigItem } from '@/contexts/types';
import { useFacilities } from '@/contexts/FacilityContext';

interface LocationFacilitySectionProps {
  locationId: string;
  locations: ConfigItem[];
  facilityId: string;
  facilities: ConfigItem[];
  onSelectChange: (name: string, value: string) => void;
}

const LocationFacilitySection: React.FC<LocationFacilitySectionProps> = ({
  locationId,
  locations,
  facilityId,
  facilities,
  onSelectChange,
}) => {
  // Also get the facilities from context to supplement the facilities from config management
  const { facilities: contextFacilities } = useFacilities();

  // Create a merged list of facilities
  const allFacilities = [...facilities];
  
  // Add facilities from context if they don't already exist and aren't empty
  contextFacilities.forEach(facilityName => {
    if (facilityName && typeof facilityName === 'string' && facilityName.trim() !== '') {
      const exists = facilities.some(f => f.name === facilityName);
      if (!exists) {
        allFacilities.push({
          id: `facility-${facilityName}`,
          name: facilityName
        });
      }
    }
  });

  // Filter out any facilities with empty names
  const filteredFacilities = allFacilities.filter(
    facility => facility.name && facility.name.trim() !== ''
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="locationId" className="text-sm font-medium">
          Location <span className="text-red-500">*</span>
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
          value={facilityId} 
          onValueChange={(value) => onSelectChange('facilityId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {filteredFacilities.length > 0 ? (
              filteredFacilities.map((facility, index) => (
                <SelectItem key={`${facility.id}-${index}`} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-gray-500">No facilities available</div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationFacilitySection;
