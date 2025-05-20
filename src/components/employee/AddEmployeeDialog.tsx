
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Employee, EmployeeType, DepartmentType } from '@/contexts/employee/types';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from '../users/form/ModuleAccess';

// Define the form schema with zod
const employeeSchema = z.object({
  employeeId: z.string().min(1, { message: "Employee ID is required" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  employeeType: z.enum(["permanent", "contract", "part_time", "consultant", "intern"]),
  department: z.enum(["admin", "teaching", "security", "maintenance", "transport", "management", "it", "hr", "finance"]),
  joiningDate: z.string().min(1, { message: "Joining date is required" }),
  clientId: z.string().optional(), // Add optional clientId
});

type FormValues = z.infer<typeof employeeSchema>;

interface AddEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAddEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  clientId?: string; // Add optional clientId prop
}

const AddEmployeeDialog = ({ isOpen, setIsOpen, onAddEmployee, clientId }: AddEmployeeDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const { state } = useEmployeeStore();

  // Log the clientId prop to verify what's being received
  console.log("AddEmployeeDialog received clientId:", clientId);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      employeeType: 'permanent',
      department: 'admin',
      joiningDate: new Date().toISOString().split('T')[0],
      clientId: clientId || '', // Set default clientId from props
    },
  });

  // Update form values when clientId prop changes
  useEffect(() => {
    if (clientId) {
      console.log("Setting clientId in form:", clientId);
      form.setValue('clientId', clientId);
    }
  }, [clientId, form]);

  const handleCloseDialog = () => {
    // Reset the form and selected modules when dialog closes
    form.reset();
    setSelectedModules([]);
    setIsOpen(false);
  };

  // Handle module selection changes
  const handleModuleChange = (modules: ModuleAccessItem[]) => {
    console.log("Selected modules changed:", modules);
    setSelectedModules(modules);
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const employeeId = values.employeeId;
      
      // Add the employeeId to each module in the selected modules
      // We only need to send name and key - the edge function will handle module_id lookup
      const moduleAccessPayload = selectedModules.map(module => ({
        name: module.name,
        employeeId: employeeId,
        key: module.key
      }));
      
      // Ensure clientId is included in the employee data
      const employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: values.employeeId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        employeeType: values.employeeType as EmployeeType,
        department: values.department as DepartmentType,
        joiningDate: values.joiningDate,
        status: 'active',
        clientId: values.clientId || clientId, // Ensure clientId is set from either form or props
        moduleAccessPayload // Add the moduleAccessPayload directly
      };
      
      console.log("Adding employee with data:", employeeData);
      console.log("Module access payload:", moduleAccessPayload);
      
      await onAddEmployee(employeeData);
      toast.success("Employee added successfully");
      handleCloseDialog(); // Close and reset form
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error("Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teaching">Teaching</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Add module permissions section */}
            <div className="space-y-2">
              <FormLabel>Module Access</FormLabel>
              <ModuleAccess
                selectedModules={selectedModules}
                onModuleChange={handleModuleChange}
                employeeId={form.getValues("employeeId")}
              />
            </div>
            
            {/* Hidden field for clientId */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID (hidden)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!!clientId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
