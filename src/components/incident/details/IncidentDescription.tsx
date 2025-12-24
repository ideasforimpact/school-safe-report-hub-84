import React, { useState } from "react";

interface IncidentDescriptionProps {
  description: string;
  image?: string;
}

const IncidentDescription: React.FC<IncidentDescriptionProps> = ({
  description,
  image
}) => {
  const [expanded, setExpanded] = useState(false);
  const shortText =description.length > 500 ? description.substring(0, 500) + "..." : description;
  return (
    <div className="space-y-4 text-left">
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-500">Description</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
            {!expanded ? shortText : description}
          </p>
          {description.length > 500 && (
            <button
              className="text-blue-600 text-sm underline mt-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "view less" : "view more"}
            </button>
          )}
        </div>
      </div>

      {image && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500">Image</h3>
          <img 
            src={image} 
            alt="Incident" 
            className="rounded-md border max-w-full h-auto" 
            onError={(e) => {
              console.error("Image failed to load:", image);
              e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
            }}
          />
        </div>
      )}
    </div>
  );
};

export default IncidentDescription;
