
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VehicleNotFound = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" data-testid="alert-circle-icon" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">Vehicle Not Found</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        The vehicle you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link to="/transport-safety">Return to Vehicles List</Link>
      </Button>
    </div>
  );
};

export default VehicleNotFound;
