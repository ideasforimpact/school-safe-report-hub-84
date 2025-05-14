
import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EditEmployeeDialog from './EditEmployeeDialog';
import { Badge } from '@/components/ui/badge';

const EmployeesList = () => {
  const { employees, deleteEmployee, getEmployeeDocuments } = useEmployeeVerification();
  const navigate = useNavigate();

  // Create a memoized map of employee documents to avoid recalculation on each render
  const employeeDocumentsMap = useMemo(() => {
    const map = new Map();
    employees.forEach(employee => {
      map.set(employee.id, getEmployeeDocuments(employee.id));
    });
    return map;
  }, [employees, getEmployeeDocuments]);

  const renderDocumentsInfo = (employeeId: string) => {
    const documents = employeeDocumentsMap.get(employeeId) || [];
    
    // Group by verification status
    const verified = documents.filter(doc => doc.verificationStatus === 'verified');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');

    if (verified.length === 0 && failed.length === 0) {
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
      </div>
    );
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
                const isInactive = employee.status === 'failed'; // Specific to verification system
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="max-w-md">
                      {renderDocumentsInfo(employee.id)}
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
                        <EditEmployeeDialog 
                          employee={employee}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this employee and all associated verification documents.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteEmployee(employee.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
