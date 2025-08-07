
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Calendar, Hash, UserCheck } from 'lucide-react';
import { Employee } from '@/types/employeeVerification';
import { format } from 'date-fns';
import { formatDepartment } from '@/lib/formatUtils';

interface BackofficeEmployeeDetailsProps {
  employee: Employee;
}

const BackofficeEmployeeDetails: React.FC<BackofficeEmployeeDetailsProps> = ({ employee }) => {
  const getEmployeeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'permanent':
        return 'bg-green-100 text-green-800';
      case 'contract':
        return 'bg-blue-100 text-blue-800';
      case 'temporary':
        return 'bg-yellow-100 text-yellow-800';
      case 'part_time':
        return 'bg-purple-100 text-purple-800';
      case 'consultant':
        return 'bg-orange-100 text-orange-800';
      case 'intern':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    ) : (
      <Badge variant="destructive">Inactive</Badge>
    );
  };

  const formatEmployeeType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Employee Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{employee.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium">{employee.employeeId}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{formatDepartment(employee.department)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-medium">
                  {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : 'Not specified'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Status & Type</p>
              <div className="flex gap-2">
                {getStatusBadge(employee.status)}
                <Badge className={getEmployeeTypeColor(employee.employeeType)}>
                  {formatEmployeeType(employee.employeeType)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {employee.position && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Building className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium">{employee.position}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackofficeEmployeeDetails;
