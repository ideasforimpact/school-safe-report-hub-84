
import React, { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { getAllCampuses } from '@/services/campus/campusService';
import { getFacilitiesByCampus, FacilityItem } from '@/services/facility/facilityService';
import { toast } from 'sonner';
import { ConfigItem } from '@/contexts/types';

interface LocationSectionProps {
  locationId: string;
  facilityId: string;
  onSelectChange: (name: string, value: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  locationId,
  facilityId,
  onSelectChange,
}) => {
  const [campuses, setCampuses] = useState<ConfigItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  // Fetch campuses from database
  useEffect(() => {
    const fetchCampuses = async () => {
      setLoadingCampuses(true);
      try {
        const data = await getAllCampuses();
        setCampuses(data);
      } catch (error) {
        console.error("Error fetching campuses:", error);
        toast.error("Failed to load campuses");
        setCampuses([]);
      } finally {
        setLoadingCampuses(false);
      }
    };

    fetchCampuses();
  }, []);

  // Fetch facilities when campus changes
  useEffect(() => {
    if (!locationId) {
      setFacilities([]);
      return;
    }

    const fetchFacilities = async () => {
      setLoadingFacilities(true);
      try {
        const data = await getFacilitiesByCampus(locationId);
        setFacilities(data);
      } catch (error) {
        console.error(`Error fetching facilities for campus ${locationId}:`, error);
        toast.error("Failed to load facilities for this campus");
        setFacilities([]);
      } finally {
        setLoadingFacilities(false);
      }
    };

    fetchFacilities();
  }, [locationId]);

  // Handle campus change
  const handleCampusChange = (value: string) => {
    onSelectChange('locationId', value);
    // Reset facility when campus changes
    onSelectChange('facilityId', '');
  };

  return (
    <>
      <div className="space-y-2">
        <label htmlFor="locationId" className="text-sm font-medium">
          Campus <span className="text-red-500">*</span>
        </label>
        <Select 
          value={locationId}
          onValueChange={handleCampusChange}
          disabled={loadingCampuses}
          required
        >
          <SelectTrigger>
            {loadingCampuses ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading campuses...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select campus" />
            )}
          </SelectTrigger>
          <SelectContent>
            {campuses.length === 0 ? (
              <div className="px-2 py-2 text-sm text-gray-500">No campuses available</div>
            ) : (
              campuses.map(campus => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))
            )}
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
          disabled={!locationId || loadingFacilities}
          required
        >
          <SelectTrigger>
            {loadingFacilities ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading facilities...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select facility" />
            )}
          </SelectTrigger>
          <SelectContent>
            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-gray-500">
                {locationId ? "No facilities available for this campus" : "Select a campus first"}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default LocationSection;
