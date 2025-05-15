
import React from 'react';

const ReportIncidentHeader: React.FC = () => {
  return (
    <div className="text-left">
      <h1 className="text-2xl md:text-3xl font-bold">Report New Incident</h1>
      <p className="text-gray-600 mt-1">
        Document safety incidents, near misses, or unsafe conditions
      </p>
    </div>
  );
};

export default ReportIncidentHeader;
