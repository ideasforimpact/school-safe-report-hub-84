
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
import { Eye, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { toast } from "sonner";

const EmployeesList = () => {
  const { employees, updateEmployee } = useEmployeeVerification();
  const navigate = useNavigate();

  // Function to handle verification via government API
  const handleGovtVerify = async (employeeId: string) => {
    try {
      // In a real application, this would make an API call to a government verification service
      // For now, we'll simulate success with a timeout
      toast.loading("Verifying with Government API...");
      
      // Simulate API delay
      setTimeout(() => {
        updateEmployee(employeeId, { status: 'verified' });
        toast.success("Employee verified successfully via Government API");
      }, 1500);
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      console.error("Verification error:", error);
    }
  };

  // Function to handle manual verification
  const handleManualVerify = (employeeId: string) => {
    updateEmployee(employeeId, { status: 'verified' });
    toast.success("Employee manually verified successfully");
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
              <TableHead>Verify</TableHead>
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
                const isVerified = employee.status === 'verified';
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isVerified ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGovtVerify(employee.id)}
                              disabled={isInactive}
                            >
                              Govt.
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManualVerify(employee.id)}
                              disabled={isInactive}
                            >
                              Manual
                            </Button>
                          </>
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
                          <Eye className="h-4 w-4" />
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
