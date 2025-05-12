
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import VerificationStatusBadge from './VerificationStatusBadge';

const EmployeesList = () => {
  const { employees, deleteEmployee } = useEmployeeVerification();
  const navigate = useNavigate();

  const getStatusIcon = (status: 'verified' | 'failed' | 'pending') => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600 mr-2" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600 mr-2" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                // Determine if employee is inactive (for verification system)
                const isInactive = employee.status === 'failed'; // Specific to verification system
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(employee.status)}
                        <VerificationStatusBadge status={employee.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/employee-verification/${employee.id}`)}
                          disabled={isInactive}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeesList;
