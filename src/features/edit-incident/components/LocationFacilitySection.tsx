
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilities } from '@/contexts/FacilityContext';

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
  // Get facilities from FacilityContext
  const { facilities } = useFacilities();

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
          School Facility <span className="text-red-500">*</span>
        </label>
        <Select 
          value={facility}
          onValueChange={(value) => onSelectChange('facility', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((facility, index) => (
              <SelectItem key={`facility-${index}`} value={facility}>
                {facility}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default LocationFacilitySection;
