
import React from 'react';

const SubmissionSuccessMessage: React.FC = () => {
  return (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Thank You</h2>
      <p className="text-gray-700 mb-6">
        Your grievance has been submitted successfully. You will be contacted if you requested follow-up.
      </p>
    </div>
  );
};

export default SubmissionSuccessMessage;
