
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EditEmployeeDialog from './EditEmployeeDialog';
import VerificationStatusBadge from './VerificationStatusBadge';

const EmployeesList = () => {
  const { employees, deleteEmployee, getEmployeeDocuments } = useEmployeeVerification();
  const navigate = useNavigate();

  const getDocumentCounts = (employeeId: string) => {
    const documents = getEmployeeDocuments(employeeId);
    const verified = documents.filter(doc => doc.verificationStatus === 'verified').length;
    const pending = documents.filter(doc => doc.verificationStatus === 'pending').length;
    const failed = documents.filter(doc => doc.verificationStatus === 'failed').length;
    return { verified, pending, failed, total: documents.length };
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
                const counts = getDocumentCounts(employee.id);
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {counts.total > 0 ? (
                          <>
                            {counts.verified > 0 && (
                              <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                                {counts.verified} Verified
                              </span>
                            )}
                            {counts.pending > 0 && (
                              <span className="px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                                {counts.pending} Pending
                              </span>
                            )}
                            {counts.failed > 0 && (
                              <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                                {counts.failed} Failed
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">No documents</span>
                        )}
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
