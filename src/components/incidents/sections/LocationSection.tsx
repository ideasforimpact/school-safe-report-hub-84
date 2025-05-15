
import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface LocationSectionProps {
  locationId: string;
  facilityId: string;
  onSelectChange: (name: string, value: string) => void;
  locations?: { id: string; name: string; }[];
  facilities?: { id: string; name: string; campus_id: string }[];
  loading?: boolean;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange,
  locations = [],
  facilities = [],
  loading = false
}) => {
  const [availableFacilities, setAvailableFacilities] = useState<{id: string, name: string}[]>([]);

  // Filter facilities when location changes
  useEffect(() => {
    if (locationId) {
      const filtered = facilities.filter(facility => facility.campus_id === locationId);
      setAvailableFacilities(filtered);
      
      // Reset facility if current selection isn't available in the new list
      const currentFacilityExists = filtered.some(facility => facility.id === facilityId);
      if (facilityId && !currentFacilityExists) {
        onSelectChange('facilityId', '');
      }
    } else {
      setAvailableFacilities([]);
    }
  }, [locationId, facilities, facilityId, onSelectChange]);

  return (
    <div className="space-y-4 text-left">
      <div>
        <label htmlFor="locationId" className="text-sm font-medium block">
          Where it Happened <span className="text-red-500">*</span>
        </label>
        <Select 
          value={locationId} 
          onValueChange={(value) => onSelectChange('locationId', value)}
          required
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select location" />
            )}
          </SelectTrigger>
          <SelectContent>
            {locations.length === 0 ? (
              <SelectItem disabled value="">No locations available</SelectItem>
            ) : (
              locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="facilityId" className="text-sm font-medium block">
          Facility <span className="text-red-500">*</span>
        </label>
        <Select 
          value={facilityId} 
          onValueChange={(value) => onSelectChange('facilityId', value)}
          required
          disabled={!locationId || availableFacilities.length === 0 || loading}
        >
          <SelectTrigger className="w-full">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select facility" />
            )}
          </SelectTrigger>
          <SelectContent>
            {availableFacilities.length === 0 ? (
              <SelectItem disabled value="">No facilities available</SelectItem>
            ) : (
              availableFacilities.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSection;
