
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth, User, UserRole, ModulePermissions } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reporter' as UserRole,
    modulePermissions: {
      incidentReporting: true,
      allIncidents: true,
      insights: true,
      benchmarking: false // Added benchmarking permission (default off)
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'reporter',
      modulePermissions: {
        incidentReporting: true,
        allIncidents: true,
        insights: true,
        benchmarking: false
      }
    });
    setCurrentUser(null);
  };

  const handleAddUser = () => {
    addUser(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      modulePermissions: user.modulePermissions || {
        incidentReporting: true,
        allIncidents: true,
        insights: true
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        modulePermissions: formData.modulePermissions,
        ...(formData.password ? { password: formData.password } : {})
      });
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const handleModulePermissionChange = (module: keyof ModulePermissions, value: boolean) => {
    setFormData({
      ...formData,
      modulePermissions: {
        ...formData.modulePermissions,
        [module]: value
      }
    });
  };

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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Module Permissions</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Reporter'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.modulePermissions?.incidentReporting && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Reporting</span>
                        )}
                        {user.modulePermissions?.allIncidents && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">All Incidents</span>
                        )}
                        {user.modulePermissions?.insights && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">Insights</span>
                        )}
                        {user.modulePermissions?.benchmarking && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">Benchmarking</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role">Role</label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reporter">Reporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Module Permissions</label>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incident-reporting"
                    checked={formData.modulePermissions.incidentReporting}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('incidentReporting', checked === true)
                    }
                  />
                  <label 
                    htmlFor="incident-reporting"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incident Reporting
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="all-incidents"
                    checked={formData.modulePermissions.allIncidents}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('allIncidents', checked === true)
                    }
                  />
                  <label 
                    htmlFor="all-incidents"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All Incidents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insights"
                    checked={formData.modulePermissions.insights}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('insights', checked === true)
                    }
                  />
                  <label 
                    htmlFor="insights"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insights
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="benchmarking"
                    checked={formData.modulePermissions.benchmarking}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('benchmarking', checked === true)
                    }
                  />
                  <label 
                    htmlFor="benchmarking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Benchmarking
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name">Name</label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-email">Email</label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-password">
                Password <span className="text-sm text-gray-500">(leave empty to keep current)</span>
              </label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Leave empty to keep current password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-role">Role</label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({...formData, role: value})}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reporter">Reporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Module Permissions</label>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-incident-reporting"
                    checked={formData.modulePermissions.incidentReporting}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('incidentReporting', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-incident-reporting"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incident Reporting
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-all-incidents"
                    checked={formData.modulePermissions.allIncidents}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('allIncidents', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-all-incidents"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All Incidents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-insights"
                    checked={formData.modulePermissions.insights}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('insights', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-insights"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insights
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-benchmarking"
                    checked={formData.modulePermissions.benchmarking}
                    onCheckedChange={(checked) => 
                      handleModulePermissionChange('benchmarking', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-benchmarking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Benchmarking
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UserManagement;
