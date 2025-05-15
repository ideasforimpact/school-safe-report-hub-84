import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationSectionProps {
  locationId: string;
  facilityId: string;
  onSelectChange: (name: string, value: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange
}) => {
  return (
    <div className="space-y-4 text-left">
      <div>
        <label htmlFor="locationId" className="text-sm font-medium block">
          Location <span className="text-red-500">*</span>
        </label>
        <Select 
          value={locationId} 
          onValueChange={(value) => onSelectChange('locationId', value)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Main Campus</SelectItem>
            <SelectItem value="2">North Campus</SelectItem>
            <SelectItem value="3">South Campus</SelectItem>
            <SelectItem value="4">West Campus</SelectItem>
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
          disabled={!locationId}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {locationId === '1' && (
              <>
                <SelectItem value="101">Classroom Building</SelectItem>
                <SelectItem value="102">Administration</SelectItem>
                <SelectItem value="103">Cafeteria</SelectItem>
                <SelectItem value="104">Gymnasium</SelectItem>
              </>
            )}
            {locationId === '2' && (
              <>
                <SelectItem value="201">Science Lab</SelectItem>
                <SelectItem value="202">Library</SelectItem>
                <SelectItem value="203">Auditorium</SelectItem>
              </>
            )}
            {/* Add other facilities based on selected location */}
            {!['1', '2'].includes(locationId) && locationId && (
              <SelectItem value="general">Main Building</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSection;
