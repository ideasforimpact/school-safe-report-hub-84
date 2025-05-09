
import { useState } from 'react';
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
import { UserPlus, Upload } from 'lucide-react';
import EmployeeList from '@/components/employee/EmployeeList';
import AddEmployeeDialog from '@/components/employee/AddEmployeeDialog';
import EditEmployeeDialog from '@/components/employee/EditEmployeeDialog';
import ImportEmployeeDialog from '@/components/employee/ImportEmployeeDialog';
import { Employee } from '@/contexts/employee/types';
import { toast } from 'sonner';

const EmployeeManagement = () => {
  const { isAdmin } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployee();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

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
    setCurrentEmployee(employee);
    setIsEditDialogOpen(true);
  };

  // Temporary placeholder function for handling file imports
  // In a real implementation, this would parse the Excel file and add employees
  const handleImportEmployees = async (file: File) => {
    // This is just a placeholder. In reality, you would:
    // 1. Parse the Excel file (using a library like xlsx or exceljs)
    // 2. Convert the data to employee objects
    // 3. Validate the data
    // 4. Add each employee to the system
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just show a toast notification
    toast.success(`File "${file.name}" was processed. Import functionality will be implemented later.`);
    
    console.log("Import file:", file);
  };

  // Sort active employees to the top
  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Manage employees and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeList 
              employees={sortedEmployees}
              onEditClick={handleEditClick}
              onDeleteEmployee={deleteEmployee}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        onAddEmployee={addEmployee}
      />

      {/* Edit Employee Dialog */}
      {currentEmployee && (
        <EditEmployeeDialog 
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          employee={currentEmployee}
          onUpdateEmployee={updateEmployee}
        />
      )}

      {/* Import Employees Dialog */}
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportEmployees={handleImportEmployees}
      />
    </Layout>
  );
};

export default EmployeeManagement;
