
import React from 'react';
import { Button } from '@/components/ui/button';

interface EditIncidentHeaderProps {
  isVoided: boolean | undefined;
  onVoidClick: () => void;
}

const EditIncidentHeader: React.FC<EditIncidentHeaderProps> = ({ 
  isVoided, 
  onVoidClick 
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Incident</h1>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onVoidClick}
          disabled={isVoided}
        >
          {isVoided ? 'Incident Voided' : 'Void Incident'}
        </Button>
      </div>
      <p className="text-gray-600 mt-1">
        Update incident details
      </p>
    </>
  );
};

export default EditIncidentHeader;
