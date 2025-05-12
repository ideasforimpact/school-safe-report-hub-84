
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
import { 
  Eye, 
  CheckCircle, 
  FileCheck, 
  AlertCircle,
  CreditCard,  // Aadhar
  FileText,    // PAN
  Car,         // Driving License
  Globe,       // Passport
  Building,    // Bank Account
  Users,       // Voter ID
  File         // Other
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { toast } from "sonner";
import { VerificationDocumentType } from '@/types/employeeVerification';

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

  // Get document icon by type
  const getDocumentIcon = (type: VerificationDocumentType) => {
    switch (type) {
      case 'aadhar': return <CreditCard className="h-4 w-4" />;
      case 'pan': return <FileText className="h-4 w-4" />;
      case 'driving_license': return <Car className="h-4 w-4" />;
      case 'passport': return <Globe className="h-4 w-4" />;
      case 'bank_account': return <Building className="h-4 w-4" />;
      case 'voter_id': return <Users className="h-4 w-4" />;
      case 'other': return <File className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Get grouped documents by type with status for an employee
  const getEmployeeDocumentsByType = (employeeId: string) => {
    const employeeDocs = documents.filter(doc => doc.employeeId === employeeId);
    const result: Record<VerificationDocumentType, { status: 'verified' | 'failed' | 'pending', count: number }> = {} as any;
    
    employeeDocs.forEach(doc => {
      if (!result[doc.documentType]) {
        result[doc.documentType] = { status: doc.verificationStatus, count: 1 };
      } else {
        result[doc.documentType].count += 1;
        
        // If any doc of this type is verified, mark the type as verified
        if (doc.verificationStatus === 'verified') {
          result[doc.documentType].status = 'verified';
        }
        // If no verified but has failed, mark as failed
        else if (doc.verificationStatus === 'failed' && result[doc.documentType].status !== 'verified') {
          result[doc.documentType].status = 'failed';
        }
      }
    });
    
    return result;
  };

  // Get status color for document badge
  const getStatusColor = (status: 'verified' | 'failed' | 'pending') => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
                const documentsByType = getEmployeeDocumentsByType(employee.id);
                
                return (
                  <TableRow key={employee.id} className={isInactive ? "bg-gray-100" : ""}>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {Object.entries(documentsByType).length > 0 ? (
                          Object.entries(documentsByType).map(([type, info]) => (
                            <div 
                              key={type} 
                              className={`flex items-center border px-1 py-0.5 rounded ${getStatusColor(info.status)}`}
                              title={`${type}: ${info.status}`}
                            >
                              {getDocumentIcon(type as VerificationDocumentType)}
                              {info.count > 1 && (
                                <span className="text-xs ml-1">{info.count}</span>
                              )}
                            </div>
                          ))
                        ) : (
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
                              Govt
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
