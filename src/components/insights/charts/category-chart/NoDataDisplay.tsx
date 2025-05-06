
import React from 'react';

const NoDataDisplay: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      No data available for the selected filters
    </div>
  );
};

export default NoDataDisplay;
