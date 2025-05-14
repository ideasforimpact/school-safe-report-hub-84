
import React from 'react';
import { Employee } from '@/types/employeeVerification';
import { format } from 'date-fns';
import VerificationStatusBadge from './VerificationStatusBadge';

interface EmployeeDetailsProps {
  employee: Employee;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{employee.name}</h2>
          <p className="text-gray-500">
            {employee.position} • {employee.department}
          </p>
        </div>
        <VerificationStatusBadge status={employee.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Employee ID</h3>
            <p>{employee.employeeId}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
            <p>{employee.email}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
            <p>{employee.phone || "Not provided"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
            <p>{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "Not provided"}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Joining Date</h3>
            <p>{employee.joiningDate ? formatDate(employee.joiningDate) : "Not provided"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Employee Type</h3>
            <p className="capitalize">{employee.employeeType}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Address</h3>
            <p>{employee.address || "Not provided"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
