
import React from 'react';
import { Employee } from '@/contexts/employee/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeeListProps {
  employees: Employee[];
  onEditClick: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => Promise<void>;
}

const EmployeeList = ({ employees, onEditClick, onDeleteEmployee }: EmployeeListProps) => {
  if (employees.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resigned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'retired':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="overflow-x-auto">
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
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>
                {employee.firstName} {employee.lastName}
              </TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>
                {employee.department.charAt(0).toUpperCase() + employee.department.slice(1).replace('_', ' ')}
              </TableCell>
              <TableCell>
                {employee.employeeType.charAt(0).toUpperCase() + employee.employeeType.slice(1).replace('_', ' ')}
              </TableCell>
              <TableCell>{formatDate(employee.joiningDate)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(employee.status)}>
                  {formatStatus(employee.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditClick(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this employee? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => onDeleteEmployee(employee.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeList;
