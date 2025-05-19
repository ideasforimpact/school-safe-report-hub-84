
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
    clientId?: string; // Add clientId to formData type
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading: boolean;
  clientId?: string; // Add clientId prop
}

const EditUserDialog = ({ isOpen, setIsOpen, formData, setFormData, onSubmit, resetForm, isLoading, clientId }: EditUserDialogProps) => {
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // When dialog opens, set the appropriate state based on the form data
  useEffect(() => {
    if (isOpen && formData) {
      setShowAdminOptions(formData.role === 'admin');
      
      // Extract enabled permissions
      const enabledPermissions = Object.entries(formData.modulePermissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      setSelectedPermissions(enabledPermissions as string[]);
      
      // Ensure clientId is set in formData
      if (!formData.clientId && clientId) {
        setFormData({
          ...formData,
          clientId: clientId
        });
      }
    }
  }, [isOpen, formData, setFormData, clientId]);

  const handleRoleChange = (value: string) => {
    const role = value as UserRole;
    setFormData({
      ...formData,
      role,
      modulePermissions: {
        ...formData.modulePermissions,
        superAdmin: role === 'admin' && formData.modulePermissions.superAdmin
      }
    });
    setShowAdminOptions(role === 'admin');
  };

  const handlePermissionChange = (permission: keyof ModulePermissions, checked: boolean) => {
    const newSelectedPermissions = checked 
      ? [...selectedPermissions, permission as string] 
      : selectedPermissions.filter(p => p !== permission);
    
    setSelectedPermissions(newSelectedPermissions);
    
    setFormData({
      ...formData,
      modulePermissions: {
        ...formData.modulePermissions,
        [permission]: checked
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
    setShowAdminOptions(false);
    setSelectedPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure clientId is set before submission
    if (!formData.clientId && clientId) {
      setFormData({
        ...formData,
        clientId: clientId
      });
    }
    onSubmit();
  };

  // Define modules with their display names
  const modules = [
    { key: 'superAdmin', name: 'Super Admin' },
    { key: 'incidentReporting', name: 'Incident Reporting' },
    { key: 'incidentAdmin', name: 'Incident Admin' },
    { key: 'assessmentUser', name: 'Assessment User' },
    { key: 'assessmentsAdmin', name: 'Assessments Admin' },
    { key: 'employeeVerificationAdmin', name: 'Employee Verification Admin' },
    { key: 'grievancesAdmin', name: 'Grievances Admin' },
    { key: 'transportSafetyAdmin', name: 'Transport Safety Admin' },
    { key: 'eduSafeResourceAccess', name: 'EduSafe Resource Access' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId || ''}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeType">Employee Type</Label>
                <Select
                  value={formData.employeeType}
                  onValueChange={(value) => setFormData({ ...formData, employeeType: value as EmployeeType })}
                >
                  <SelectTrigger id="employeeType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as DepartmentType })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reporter">Reporter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hidden input for clientId */}
            <input 
              type="hidden" 
              id="clientId" 
              name="clientId" 
              value={formData.clientId || clientId || ''} 
            />

            {/* Module Access Section */}
            <div className="space-y-4">
              <Label>Module Access</Label>
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Enabled</TableHead>
                      <TableHead>Module Name</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => {
                      const moduleKey = module.key as keyof ModulePermissions;
                      const isEnabled = formData.modulePermissions[moduleKey] || false;
                      
                      return (
                        <TableRow key={module.key}>
                          <TableCell>
                            <Checkbox
                              checked={isEnabled}
                              onCheckedChange={(checked) => handlePermissionChange(moduleKey, checked === true)}
                            />
                          </TableCell>
                          <TableCell>{module.name}</TableCell>
                          <TableCell className="text-center">
                            {isEnabled ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
