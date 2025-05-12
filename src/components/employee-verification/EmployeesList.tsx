
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
import { getDocumentIcon, getDocumentDisplayName } from './utils/documentUtils';

const EmployeesList = () => {
  const { employees, deleteEmployee, getEmployeeDocuments } = useEmployeeVerification();
  const navigate = useNavigate();

  const renderDocumentsInfo = (employeeId: string) => {
    const documents = getEmployeeDocuments(employeeId);
    
    if (documents.length === 0) {
      return <span className="text-gray-500 text-sm">No documents</span>;
    }

    // Group by verification status
    const verified = documents.filter(doc => doc.verificationStatus === 'verified');
    const pending = documents.filter(doc => doc.verificationStatus === 'pending');
    const failed = documents.filter(doc => doc.verificationStatus === 'failed');

    return (
      <div className="flex flex-col space-y-2">
        {verified.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-800 bg-green-100 rounded-full px-2 py-0.5 inline-block">
              Verified ({verified.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {verified.map(doc => (
                <div key={doc.id} className="flex items-center text-xs border border-green-200 rounded px-1 py-0.5 bg-green-50">
                  {getDocumentIcon(doc.documentType)}
                  <span className="ml-1">{getDocumentDisplayName(doc.documentType)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full px-2 py-0.5 inline-block">
              Pending ({pending.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {pending.map(doc => (
                <div key={doc.id} className="flex items-center text-xs border border-yellow-200 rounded px-1 py-0.5 bg-yellow-50">
                  {getDocumentIcon(doc.documentType)}
                  <span className="ml-1">{getDocumentDisplayName(doc.documentType)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {failed.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-red-800 bg-red-100 rounded-full px-2 py-0.5 inline-block">
              Failed ({failed.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {failed.map(doc => (
                <div key={doc.id} className="flex items-center text-xs border border-red-200 rounded px-1 py-0.5 bg-red-50">
                  {getDocumentIcon(doc.documentType)}
                  <span className="ml-1">{getDocumentDisplayName(doc.documentType)}</span>
                </div>
              ))}
            </div>
          </div>
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
