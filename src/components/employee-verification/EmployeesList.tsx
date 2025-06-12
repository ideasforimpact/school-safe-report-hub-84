
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
import { Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Badge } from '@/components/ui/badge';

const EmployeesList = () => {
  const { employees, isLoading } = useEmployeeVerification();
  const navigate = useNavigate();

  // Render documents information for each employee
  const renderDocumentsInfo = (employee) => {
    const documents = employee.documents || [];
    
    // Group by verification status
    const verified = documents.filter(doc => doc.verificationStatus === 'verified');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending');
    const total = documents.length;

    if (total === 0) {
      return <span className="text-gray-500 text-sm">No documents</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {verified.length > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Verified ({verified.length})
          </Badge>
        )}
        
        {failed.length > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed ({failed.length})
          </Badge>
        )}

        {pending.length > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending ({pending.length})
          </Badge>
        )}

        <span className="text-xs text-gray-500 ml-1">
          ({total} total)
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Documents</TableHead>
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
                const isInactive = employee.status === false;
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="max-w-md">
                      {renderDocumentsInfo(employee)}
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
