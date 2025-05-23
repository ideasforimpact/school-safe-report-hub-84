
import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentManagementContent = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Redirect to the student management page
    navigate('/students');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Loading student management...</p>
      </div>
    </div>
  );
};

export default StudentManagementContent;
