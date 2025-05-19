
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Loader2 } from 'lucide-react';

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
      
      setSelectedPermissions(enabledPermissions);
      
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
      ? [...selectedPermissions, permission] 
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

            {showAdminOptions && (
              <div className="space-y-4">
                <Label>Admin Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="superAdmin"
                      checked={formData.modulePermissions.superAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('superAdmin', checked === true)}
                    />
                    <Label htmlFor="superAdmin">Super Admin (Full access)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incidentAdmin"
                      checked={formData.modulePermissions.incidentAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('incidentAdmin', checked === true)}
                    />
                    <Label htmlFor="incidentAdmin">Incident Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assessmentsAdmin"
                      checked={formData.modulePermissions.assessmentsAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('assessmentsAdmin', checked === true)}
                    />
                    <Label htmlFor="assessmentsAdmin">Assessments Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="employeeVerificationAdmin"
                      checked={formData.modulePermissions.employeeVerificationAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('employeeVerificationAdmin', checked === true)}
                    />
                    <Label htmlFor="employeeVerificationAdmin">Employee Verification Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="grievancesAdmin"
                      checked={formData.modulePermissions.grievancesAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('grievancesAdmin', checked === true)}
                    />
                    <Label htmlFor="grievancesAdmin">Grievances Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transportSafetyAdmin"
                      checked={formData.modulePermissions.transportSafetyAdmin}
                      onCheckedChange={(checked) => handlePermissionChange('transportSafetyAdmin', checked === true)}
                    />
                    <Label htmlFor="transportSafetyAdmin">Transport Safety Admin</Label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>User Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incidentReporting"
                    checked={formData.modulePermissions.incidentReporting}
                    onCheckedChange={(checked) => handlePermissionChange('incidentReporting', checked === true)}
                  />
                  <Label htmlFor="incidentReporting">Incident Reporting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assessmentUser"
                    checked={formData.modulePermissions.assessmentUser}
                    onCheckedChange={(checked) => handlePermissionChange('assessmentUser', checked === true)}
                  />
                  <Label htmlFor="assessmentUser">Assessment User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eduSafeResourceAccess"
                    checked={formData.modulePermissions.eduSafeResourceAccess}
                    onCheckedChange={(checked) => handlePermissionChange('eduSafeResourceAccess', checked === true)}
                  />
                  <Label htmlFor="eduSafeResourceAccess">EduSafe Resource Access</Label>
                </div>
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
