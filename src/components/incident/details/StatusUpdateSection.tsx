
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncidentStatus } from '@/types/incident';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStatusDisplayName } from '@/utils/statusUtils';

interface StatusOption {
  id: string;
  name: string;
  displayName: string;
}

interface StatusUpdateSectionProps {
  currentStatus: IncidentStatus;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  onCloseButtonClick: () => void;
  getStatusColor: (status: IncidentStatus) => string;
}

const StatusUpdateSection: React.FC<StatusUpdateSectionProps> = ({
  currentStatus,
  statusUpdate,
  setStatusUpdate,
  onStatusChange,
  onCloseButtonClick,
  getStatusColor
}) => {
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch status options from the database
    const fetchStatusOptions = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('incident_status')
          .select('id, name')
          .order('name');
          
        if (error) {
          console.error('Error fetching status options:', error);
          return;
        }
        
        if (data) {
          // Transform to include display names
          const options = data.map(status => ({
            id: status.id,
            name: status.name,
            displayName: getStatusDisplayName(status.name)
          }));
          setStatusOptions(options);
        }
      } catch (err) {
        console.error('Unexpected error fetching status options:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatusOptions();
  }, []);
  
  return (
    <div className="text-left">
      <h3 className="font-medium text-sm">Status</h3>
      <div className="flex items-center space-x-2">
        <Select 
          value={statusUpdate as string}
          onValueChange={(value) => setStatusUpdate(value as IncidentStatus)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select status"} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.id} value={status.name}>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status.name as IncidentStatus)}`}>
                  {status.displayName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {statusUpdate === 'Closed' && currentStatus !== 'Closed' ? (
          <Button 
            onClick={onCloseButtonClick}
            variant="outline" 
            size="sm"
          >
            Close Incident
          </Button>
        ) : (
          <Button 
            onClick={onStatusChange}
            variant="outline" 
            size="sm"
            disabled={statusUpdate === currentStatus || isLoading}
          >
            Update
          </Button>
        )}
      </div>
    </div>
  );
};

export default StatusUpdateSection;
