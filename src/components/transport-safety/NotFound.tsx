
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const VehicleNotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
      <p className="text-gray-600">The requested vehicle could not be found or you don't have permission to view it.</p>
    </div>
  );
};
