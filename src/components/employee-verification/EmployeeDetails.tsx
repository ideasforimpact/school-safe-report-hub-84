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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{employee.name}</h2>
            <p className="text-gray-500">{employee.position} · {employee.department}</p>
          </div>
          <VerificationStatusBadge status={employee.status} className="text-sm px-3 py-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-6">
          <div>
            <p className="text-sm text-gray-500">Employee ID</p>
            <p className="font-medium">{employee.employeeId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{employee.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joining Date</p>
            <p className="font-medium">{formatDate(employee.joiningDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-medium">{employee.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Position</p>
            <p className="font-medium">{employee.position}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Verification Status</p>
            <p className="font-medium">
              <VerificationStatusBadge status={employee.status} />
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{employee.address}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;
