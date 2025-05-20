
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmployeeForm from './EmployeeForm';
import { Employee } from '@/contexts/employee/types';
import { supabase } from '@/integrations/supabase/client';
import { getEmployeeModuleAccessItems } from '@/services/employee/employeeModuleService';
import { toast } from 'sonner';
import { ModuleAccessItem } from '@/types/moduleAccess';

interface EditEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  employee: Employee;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
}

const EditEmployeeDialog = ({ 
  isOpen, 
  setIsOpen, 
  employee,
  onUpdateEmployee
}: EditEmployeeDialogProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    ...employee
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when employee changes
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        // Set basic employee data
        setFormData({...employee});
        
        // Fetch module access items for this employee
        if (employee.id) {
          const moduleAccessItems = await getEmployeeModuleAccessItems(employee.id);
          console.log("Fetched module access items for employee:", moduleAccessItems);
          
          // Update formData with the module access payload
          setFormData(prevData => ({
            ...prevData,
            moduleAccessPayload: moduleAccessItems
          }));
        }
      } catch (error) {
        console.error("Error fetching employee module data:", error);
        toast.error("Failed to fetch employee module access data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && employee.id) {
      fetchEmployeeData();
    }
  }, [isOpen, employee]);

  const handleSubmit = async () => {
    await onUpdateEmployee(employee.id, formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm formData={formData} setFormData={setFormData} isEditMode={true} isLoading={isLoading} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Loading..." : "Update Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
