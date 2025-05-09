
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
import { UserPlus, FileUp } from 'lucide-react';
import EmployeeList from '@/components/employee/EmployeeList';
import AddEmployeeDialog from '@/components/employee/AddEmployeeDialog';
import EditEmployeeDialog from '@/components/employee/EditEmployeeDialog';
import ImportEmployeeDialog from '@/components/employee/ImportEmployeeDialog';
import { Employee } from '@/contexts/employee/types';
import { toast } from 'sonner';
import { processEmployeeExcel } from '@/services/employee/importEmployeeService';

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

  const handleImportEmployees = async (file: File) => {
    try {
      await processEmployeeExcel(file);
      toast.success("Employees imported successfully");
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error("Failed to process employee import");
    }
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
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Employees</span>
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
