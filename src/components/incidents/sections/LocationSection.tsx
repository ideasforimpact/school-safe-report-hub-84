
import React from 'react';
import { useLocationOptions } from '@/hooks/incident-form/useLocationOptions';
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
  errors?: Record<string, string>;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange,
  errors = {}
}) => {
  const { 
    locations, 
    facilities, 
    loading: locationsLoading 
  } = useLocationOptions(locationId);

  const handleLocationChange = (value: string) => {
    onSelectChange('locationId', value);
    // Reset facility when location changes
    onSelectChange('facilityId', '');
  };

  const handleFacilityChange = (value: string) => {
    onSelectChange('facilityId', value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Location</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="locationId" className="text-sm font-medium block">
            Location <span className="text-red-500">*</span>
          </label>
          <Select 
            value={locationId}
            onValueChange={handleLocationChange}
            disabled={locationsLoading}
          >
            <SelectTrigger className={errors.locationId ? "border-red-500" : ""}>
              {locationsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading locations...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select location" />
              )}
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
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
          </label>
          <Select 
            value={facilityId}
            onValueChange={handleFacilityChange}
            disabled={!locationId || facilities.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
