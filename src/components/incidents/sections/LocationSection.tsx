import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Location {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
  campus_id: string;
}

interface LocationSectionProps {
  locationId: string;
  facilityId: string;
  onSelectChange: (name: string, value: string) => void;
  locations: Location[];
  facilities: Facility[];
  loading: boolean;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange,
  locations,
  facilities,
  loading
}) => {
  // Filter facilities based on selected location
  const filteredFacilities = facilities.filter(facility => facility.campus_id === locationId);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">
          Where it Happened <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={locationId}
          onValueChange={(value) => {
            onSelectChange('locationId', value);
            // Reset facility when location changes
            onSelectChange('facilityId', '');
          }}
          disabled={loading}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={loading ? "Loading..." : "Select location"} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="facility" className="text-sm font-medium text-gray-700">
          Facility <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={facilityId}
          onValueChange={(value) => {
            onSelectChange('facilityId', value);
          }}
          disabled={loading || !locationId || filteredFacilities.length === 0}
        >
          <SelectTrigger className="h-11 bg-white border-gray-300">
            <SelectValue placeholder={
              loading ? "Loading..." : 
              !locationId ? "Select location first" : 
              filteredFacilities.length === 0 ? "No facilities available" : 
              "Select facility"
            } />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {filteredFacilities.map((facility) => (
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
