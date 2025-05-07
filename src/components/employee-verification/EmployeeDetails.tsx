
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Employee } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import EditEmployeeDialog from './EditEmployeeDialog';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import VerificationStatusBadge from './VerificationStatusBadge';

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

  const getEmployeeTypeDisplay = (type?: string) => {
    if (!type) return 'Not Specified';
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card>
      <CardContent className="pt-6 text-left">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-left">{employee.name}</h2>
            <p className="text-gray-500 text-left">{employee.position} · {employee.department}</p>
          </div>
          <VerificationStatusBadge status={employee.status} className="text-sm px-3 py-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-6">
          <div>
            <p className="text-sm text-gray-500 text-left">Employee ID</p>
            <p className="font-medium text-left">{employee.employeeId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Email</p>
            <p className="font-medium text-left">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Phone</p>
            <p className="font-medium text-left">{employee.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Date of Birth</p>
            <p className="font-medium text-left">{formatDate(employee.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Joining Date</p>
            <p className="font-medium text-left">{formatDate(employee.joiningDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Department</p>
            <p className="font-medium text-left">{employee.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Position</p>
            <p className="font-medium text-left">{employee.position}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Employee Type</p>
            <p className="font-medium text-left">{getEmployeeTypeDisplay(employee.employeeType)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Verification Status</p>
            <p className="font-medium text-left">
              <VerificationStatusBadge status={employee.status} />
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 text-left">Address</p>
            <p className="font-medium text-left">{employee.address}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;
