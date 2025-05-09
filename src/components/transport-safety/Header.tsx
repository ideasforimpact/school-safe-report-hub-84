
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: string;
}

interface VehicleHeaderProps {
  vehicle: Vehicle;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const VehicleHeader: React.FC<VehicleHeaderProps> = ({ 
  vehicle, 
  onEditClick, 
  onDeleteClick 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </h1>
        <p className="text-gray-600">{vehicle.licensePlate}</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={onEditClick}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="text-red-600" onClick={onDeleteClick}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};
