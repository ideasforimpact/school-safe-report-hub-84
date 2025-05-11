
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/contexts/employee/EmployeeContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus, FileUp, RefreshCw } from 'lucide-react';
import EmployeeList from '@/components/employee/EmployeeList';
import AddEmployeeDialog from '@/components/employee/AddEmployeeDialog';
import EditEmployeeDialog from '@/components/employee/EditEmployeeDialog';
import ImportEmployeeDialog from '@/components/employee/ImportEmployeeDialog';
import { Employee } from '@/contexts/employee/types';
import { toast } from 'sonner';
import { processEmployeeExcel } from '@/services/employee/importEmployeeService';
import { supabase } from '@/integrations/supabase/client';

// List of demo emails that can bypass authentication
const DEMO_EMAILS = [
  'owner@saasplatform.com',
  'admin@school.edu',
  'reporter@school.edu'
];

const EmployeeManagement = () => {
  const { isAdmin, user } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee, deactivateEmployee, fetchEmployees } = useEmployee();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get clientId from user context if available
  const clientId = user?.clientId;
  
  // Check if this is a demo user
  const isDemoUser = user?.email ? DEMO_EMAILS.includes(user.email) : false;

  useEffect(() => {
    // Log the initial state of employees
    console.log("Employee management loaded with employees:", employees);
    console.log("Current user clientId:", clientId);
  }, [employees]);

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const handleEditClick = (employee: Employee) => {
    console.log("Editing employee:", employee);
    setCurrentEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeactivateEmployee = async (id: string) => {
    try {
      await deactivateEmployee(id);
      toast.success("Employee deactivated successfully");
    } catch (error) {
      console.error("Failed to deactivate employee:", error);
      toast.error("Failed to deactivate employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  const handleAddEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log("Adding employee with data:", employeeData);
      // Ensure clientId is set
      const dataWithClientId = {
        ...employeeData,
        clientId: employeeData.clientId || clientId
      };
      console.log("Final employee data with clientId:", dataWithClientId);
      await addEmployee(dataWithClientId);
      toast.success("Employee added successfully");
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast.error("Failed to add employee");
      throw error; // Rethrow to handle in the component
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      console.log("Updating employee:", id, updates);
      await updateEmployee(id, updates);
      toast.success("Employee updated successfully");
    } catch (error) {
      console.error("Update process failed:", error);
      toast.error("Failed to update employee");
      throw error; // Rethrow to handle in the component
    }
  };

  // Handler for importing employees
  const handleImportEmployees = async (file: File, importClientId?: string) => {
    setIsLoading(true);
    try {
      // Use the provided clientId or fall back to the user's clientId
      const effectiveClientId = importClientId || clientId;
      console.log("Importing employees with clientId:", effectiveClientId);
      
      // If this is a demo user, we can skip the session check
      if (!isDemoUser) {
        // Check if we have an active Supabase session before proceeding for non-demo users
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          toast.error("Please log in to import employees");
          return;
        }
      }
      
      await processEmployeeExcel(file, effectiveClientId);
      // After import, refresh the employee list
      await fetchEmployees();
      toast.success("Employees imported successfully");
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error(`Failed to process employee import: ${(error as Error).message || 'Unknown error'}`);
      throw error; // Rethrow to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  // Sort active employees to the top
  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  const handleRefreshEmployees = async () => {
    try {
      setIsLoading(true);
      await fetchEmployees();
      toast.success("Employee list refreshed");
    } catch (error) {
      console.error("Failed to refresh employees:", error);
      toast.error("Failed to refresh employee list");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
              disabled={isLoading}
            >
              <FileUp className="h-4 w-4" />
              <span>Import Employees</span>
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Employees</CardTitle>
              <CardDescription>
                Manage employees and their information
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshEmployees}
              title="Refresh employee list"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <EmployeeList 
              employees={sortedEmployees}
              onEditClick={handleEditClick}
              onDeleteEmployee={handleDeleteEmployee}
              onDeactivateEmployee={handleDeactivateEmployee}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        onAddEmployee={handleAddEmployee}
        clientId={clientId}
      />

      {/* Edit Employee Dialog */}
      {currentEmployee && (
        <EditEmployeeDialog 
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          employee={currentEmployee}
          onUpdateEmployee={handleUpdateEmployee}
        />
      )}

      {/* Import Employees Dialog */}
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportEmployees={handleImportEmployees}
        clientId={clientId}
      />
    </Layout>
  );
};

export default EmployeeManagement;
