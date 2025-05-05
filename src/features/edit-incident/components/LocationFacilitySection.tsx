
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilities } from '@/contexts/FacilityContext';
import { useIncidents } from '@/contexts/IncidentContext';

interface LocationFacilitySectionProps {
  location: string;
  facility: string;
  onSelectChange: (name: string, value: string) => void;
}

const LocationFacilitySection: React.FC<LocationFacilitySectionProps> = ({
  location,
  facility,
  onSelectChange,
}) => {
  // Get facilities from contexts
  const { facilities: contextFacilities } = useFacilities();
  const { facilities: configFacilities } = useIncidents();
  
  // Create a merged list of facilities
  const allFacilities = [...configFacilities];
  
  // Add facilities from context if they don't already exist
  contextFacilities.forEach(facilityName => {
    const exists = configFacilities.some(f => f.name === facilityName);
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
        <label htmlFor="location" className="text-sm font-medium">
          Where it Happened <span className="text-red-500">*</span>
        </label>
        <Select 
          value={location}
          onValueChange={(value) => onSelectChange('location', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="On Campus">On Campus</SelectItem>
            <SelectItem value="Off Campus">Off Campus</SelectItem>
            <SelectItem value="In Transit">In Transit</SelectItem>
            <SelectItem value="During Function">During Function</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="facility" className="text-sm font-medium">
          Incident <span className="text-red-500">*</span>
        </label>
        <Select 
          value={facility}
          onValueChange={(value) => onSelectChange('facility', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select incident facility" />
          </SelectTrigger>
          <SelectContent>
            {allFacilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.name}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default LocationFacilitySection;
