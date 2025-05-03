
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
    <div>
      <h3 className="font-medium text-sm">Description</h3>
      <p className="mt-1 whitespace-pre-wrap">{description}</p>

      {image && (
        <div className="mt-4">
          <h3 className="font-medium text-sm">Image</h3>
          <img 
            src={image} 
            alt="Incident" 
            className="mt-2 rounded-md border max-w-md" 
          />
        </div>
      )}
    </div>
  );
};

export default IncidentDescription;
