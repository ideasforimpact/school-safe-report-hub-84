
import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, FileCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { toast } from "sonner";

const EmployeesList = () => {
  const { employees, updateEmployee, documents, fetchEmployeeDocuments } = useEmployeeVerification();
  const navigate = useNavigate();

  // Fetch documents for all employees when component loads
  useEffect(() => {
    employees.forEach(employee => {
      fetchEmployeeDocuments(employee.id);
    });
  }, [employees, fetchEmployeeDocuments]);

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

  // Get document verification status for an employee
  const getDocumentStatus = (employeeId: string) => {
    const employeeDocs = documents.filter(doc => doc.employeeId === employeeId);
    
    if (employeeDocs.length === 0) {
      return { verified: 0, failed: 0, pending: 0 };
    }
    
    return {
      verified: employeeDocs.filter(doc => doc.verificationStatus === 'verified').length,
      failed: employeeDocs.filter(doc => doc.verificationStatus === 'failed').length,
      pending: employeeDocs.filter(doc => doc.verificationStatus === 'pending').length
    };
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
              <TableHead>Verify</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                // Determine if employee is inactive (for verification system)
                const isInactive = employee.status === 'failed'; // Specific to verification system
                const isVerified = employee.status === 'verified';
                const documentStatus = getDocumentStatus(employee.id);
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {documentStatus.verified > 0 && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{documentStatus.verified}</span>
                          </div>
                        )}
                        {documentStatus.failed > 0 && (
                          <div className="flex items-center text-red-500">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{documentStatus.failed}</span>
                          </div>
                        )}
                        {documentStatus.pending > 0 && (
                          <div className="flex items-center text-yellow-500">
                            <FileCheck className="h-4 w-4 mr-1" />
                            <span className="text-xs">{documentStatus.pending}</span>
                          </div>
                        )}
                        {(documentStatus.verified + documentStatus.failed + documentStatus.pending) === 0 && (
                          <span className="text-xs text-gray-500">No documents</span>
                        )}
                      </div>
                    </TableCell>
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
