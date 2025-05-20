
import React from 'react';
import { User, UserRole, ModulePermissions } from '@/contexts/auth/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserListProps {
  users: User[];
  onEditClick: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onDeactivateUser: (id: string) => void;
}

const UserList = ({ users, onEditClick, onDeleteUser, onDeactivateUser }: UserListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[150px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={!user.isActive ? "bg-muted/20" : ""}>
            <TableCell>{user.employeeId || '-'}</TableCell>
            <TableCell>{user.firstName} {user.lastName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.department ? user.department.charAt(0).toUpperCase() + user.department.slice(1) : '-'}</TableCell>
            <TableCell>{user.employeeType ? user.employeeType.charAt(0).toUpperCase() + user.employeeType.slice(1) : '-'}</TableCell>
            <TableCell>{user.joiningDate || '-'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                user.role === 'admin' || user.role === 'saas_owner' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'saas_owner' ? 'SaaS Owner' : 'Reporter'}
              </span>
            </TableCell>
            <TableCell>
              {user.isActive ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Inactive
                </Badge>
              )}
            </TableCell>
            <TableCell>
              { user.is_super_admin ?  
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEditClick(user)}
                  disabled={!user.isActive}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {user.isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <UserX className="h-4 w-4 text-amber-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to deactivate this user? They will no longer be able to log in to the system.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => onDeactivateUser(user.id)}
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this user? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div> : <div></div> }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserList;
