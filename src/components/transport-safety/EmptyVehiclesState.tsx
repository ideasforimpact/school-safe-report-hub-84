
import React from 'react';
import { Bus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyVehiclesStateProps {
  setShowAddVehicle: (show: boolean) => void;
  statusFilter: string;
}

const EmptyVehiclesState: React.FC<EmptyVehiclesStateProps> = ({ setShowAddVehicle, statusFilter }) => {
  const isInactiveFilter = statusFilter === 'inactive';
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="flex justify-center mb-4">
        <Bus className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Vehicles Found</h3>
      {/* commented this for filter showing the add new vehicle while no match found */}
      {/* {!isInactiveFilter && (
        <>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        No vehicles match your current filters. Try changing your filters or add a new vehicle.
      </p>
      <Button onClick={() => setShowAddVehicle(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Vehicle
      </Button>
        </>
      )} */}
    </div>
  );
};

export default EmptyVehiclesState;
