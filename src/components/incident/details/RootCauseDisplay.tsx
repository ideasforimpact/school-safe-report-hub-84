
import React from 'react';

interface RootCauseDisplayProps {
  rootCause?: string;
}

const RootCauseDisplay: React.FC<RootCauseDisplayProps> = ({
  rootCause
}) => {
  if (!rootCause) return null;
  
  return (
    <div className="mt-4">
      <h3 className="font-medium text-sm">Root Cause</h3>
      <p className="mt-1 whitespace-pre-wrap">{rootCause}</p>
    </div>
  );
};

export default RootCauseDisplay;
