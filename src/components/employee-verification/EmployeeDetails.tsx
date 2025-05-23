
import React from 'react';
import { Employee } from '@/types/employeeVerification';
import { format } from 'date-fns';

interface EmployeeDetailsProps {
  employee: Employee;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Employee ID</h3>
          <p className="text-base">{employee.employeeId}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
          <p className="text-base">{employee.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
          <p className="text-base">{employee.phone || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
          <p className="text-base">{employee.department}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Position</h3>
          <p className="text-base">{employee.position}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Joining Date</h3>
          <p className="text-base">{formatDate(employee.joiningDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
          <span className={`px-2 py-1 rounded-full text-xs ${
            employee.status 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {employee.status ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
          <p className="text-base">{employee.address || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
