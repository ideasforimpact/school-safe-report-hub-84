
import React from 'react';

const NoDataMessage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      No data available for the selected filters
    </div>
  );
};

export default NoDataMessage;
