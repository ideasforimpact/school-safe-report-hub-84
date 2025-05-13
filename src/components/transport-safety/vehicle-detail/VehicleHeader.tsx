
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VehicleHeader: React.FC = () => {
  return (
    <div className="flex items-center mb-8">
      <Button asChild variant="ghost" className="mr-4">
        <Link to="/transport-safety">
          <ArrowLeft className="h-4 w-4 mr-2" data-testid="arrow-left-icon" />
          Back to Vehicles
        </Link>
      </Button>
    </div>
  );
};

export default VehicleHeader;
