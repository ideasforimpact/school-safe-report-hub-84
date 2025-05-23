
// Import the Employee type to fix the type error
import { Employee } from '@/contexts/employee-verification/types';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Button } from '@/components/ui/button';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';

const UploadDocumentPage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const { getEmployee, fetchEmployees } = useEmployeeVerification();
  
  useEffect(() => {
    const loadEmployee = async () => {
      // Ensure employeeId exists
      if (!employeeId) {
        navigate('/employee-verification');
        return;
      }
      
      // Check if we already have the employee in context
      let foundEmployee = getEmployee(employeeId);
      
      // If not found, try to fetch it
      if (!foundEmployee) {
        await fetchEmployees();
        foundEmployee = getEmployee(employeeId);
      }
      
      // If still not found, redirect to main page
      if (!foundEmployee) {
        navigate('/employee-verification');
        return;
      }
      
      setEmployee(foundEmployee);
    };
    
    loadEmployee();
  }, [employeeId, getEmployee, fetchEmployees, navigate]);
  
  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading employee data...</p>
      </div>
    );
  }
  
  const handleSuccess = () => {
    navigate(`/employee-verification/${employeeId}`);
  };
  
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/employee-verification/${employeeId}`)}
          className="mr-2"
        >
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">
          Upload Document for {employee.firstName} {employee.lastName}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {/* Fixed: Pass the correct employee object instead of just employeeId */}
        <AddDocumentForm 
          employee={employee} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
};

export default UploadDocumentPage;
