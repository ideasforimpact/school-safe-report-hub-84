import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserCheck } from 'lucide-react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useNavigate } from 'react-router-dom';

interface SOPHeaderProps {
  onCreateSOP?: () => void;
}

const SOPHeader: React.FC<SOPHeaderProps> = ({ onCreateSOP }) => {
  const { state } = useEmployeeStore();
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const navigate = useNavigate();

  const handleCreateSOP = () => {
    console.log("Create SOP button clicked");
    if (onCreateSOP) {
      onCreateSOP();
    }
  };

  const handleAssignedSOP = () => {
    navigate('/sops/assigned');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div className="text-left">
        <h1 className="text-2xl font-bold">SOP</h1>
        <p className="text-gray-600 mt-1">
          Standard Operating Procedures - Create, manage, and review operational procedures
        </p>
      </div>
      
      {isSuperAdmin && (
        <div className="flex space-x-2">
          <Button 
            onClick={handleAssignedSOP}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Assigned SOP
          </Button>
          <Button 
            onClick={handleCreateSOP}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add SOP
          </Button>
        </div>
      )}
    </div>
  );
};

export default SOPHeader;

