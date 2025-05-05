
import React from 'react';

interface IncidentDescriptionProps {
  description: string;
  image?: string;
}

const IncidentDescription: React.FC<IncidentDescriptionProps> = ({
  description,
  image
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-500">Description</h3>
        <p className="whitespace-pre-wrap text-gray-800">{description}</p>
      </div>

      {image && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500">Image</h3>
          <img 
            src={image} 
            alt="Incident" 
            className="rounded-md border max-w-full h-auto" 
          />
        </div>
      )}
    </div>
  );
};

export default IncidentDescription;
