import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { Employee } from '@/contexts/employee/types';

interface EmployeeListProps {
  employees: Employee[];
  onEditClick: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeactivateEmployee: (id: string) => void;
}

const EmployeeList = ({ employees, onEditClick, onDeleteEmployee, onDeactivateEmployee }: EmployeeListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
      case 'on_leave':
        return <Badge className="bg-orange-400">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      setIsDeleting(true);
      try {
        await onDeleteEmployee(deletingId);
      } catch (error) {
        console.error("Error deleting employee:", error);
        // Toast is handled in the parent component
      } finally {
        setIsDeleting(false);
        setDeletingId(null);
      }
    }
  };

  const handleDeactivate = (id: string) => {
    setDeactivatingId(id);
  };

  const confirmDeactivate = async () => {
    if (deactivatingId) {
      setIsDeactivating(true);
      try {
        await onDeactivateEmployee(deactivatingId);
      } catch (error) {
        console.error("Error deactivating employee:", error);
        // Toast is handled in the parent component
      } finally {
        setIsDeactivating(false);
        setDeactivatingId(null);
      }
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
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow 
                  key={employee.id} 
                  className={employee.status === 'inactive' ? "bg-gray-50" : ""}
                >
                  <TableCell className="font-medium">{employee.employeeId}</TableCell>
                  <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.employeeType}</TableCell>
                  <TableCell>{formatDate(employee.joiningDate)}</TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditClick(employee)}
                        disabled={employee.status === 'inactive'}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {employee.status === 'active' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeactivate(employee.id)}
                            >
                              <PowerOff className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate this employee? 
                                They will lose all system access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeactivatingId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={confirmDeactivate}
                              >
                                {isDeactivating ? (
                                  <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Deactivating...
                                  </>
                                ) : (
                                  'Deactivate'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the employee record.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingId(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={confirmDelete}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <span className="animate-spin mr-2">⏳</span>
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeList;
